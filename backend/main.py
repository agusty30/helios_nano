"""FastAPI application for BudgetBot — autonomous AI API routing agent.

Consolidates both the x402 paywall server (formerly Express) and the LLM
routing engine into a single FastAPI service on Arc Testnet (chainId 5042002).
"""

import os
import time
from contextlib import asynccontextmanager

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from router import route_request, RouteDecision, HEAVY_TIER_COST, CHEAP_TIER_COST, SAVINGS_PER_CHEAP_CALL
from state import CanvasState
from x402_middleware import (
    SELLER, FACILITATOR_URL, NETWORK,
    _parse_payment_header, _build_402_response,
    verify_payment, usdc_to_atomic,
)


# Load environment variables
load_dotenv()

# Global state instance
canvas_state = CanvasState()

# Arc Testnet config
ARC_EXPLORER = "https://testnet.arcscan.app"
GATEWAY_WALLET = "0x0077777d7EBA4688BDeF3E311b846F25870A19B9"
ARC_RPC = os.getenv(
    "ARC_TESTNET_RPC",
    "https://rpc.testnet.arc-node.thecanteenapp.com/v1/swrm_3aa8a9334770e6eddb5cc05f2e3dbfe555eca270d4eb78fbb4b6056a4a04e2b0",
)

# Known demo settlement → batch-tx mappings
PINNED_BATCH_TX: dict[str, str] = {
    "c9933054-6b34-44bb-8c04-e7e9e1b8352c":
        "0xfbad1baae7fd9b88f4e1b034a4236da02012870acbd6ae83b583e85528be396e",
}


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: startup and shutdown events."""
    print(f"BudgetBot starting on port {os.getenv('PORT', '8000')}")
    print(f"Daily budget: ${canvas_state.daily_budget:.2f}")
    print(f"Wallet: {os.getenv('AGENT_WALLET_ADDRESS', 'not configured')}")
    print(f"Seller: {SELLER}")
    print(f"Chain: Arc Testnet (5042002)")
    print(f"RPC: {ARC_RPC[:60]}...")
    print(f"x402 endpoints: /nano ($0.000001), /hello-world ($0.01)")
    yield
    print("BudgetBot shutting down")


app = FastAPI(
    title="BudgetBot",
    description="Autonomous AI API routing agent with gas-free x402 nanopayments on Arc Testnet",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware — allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request/Response models
class AgentRouteRequest(BaseModel):
    prompt: str
    priority: str = "low"  # "low" or "high"


class AgentRouteResponse(BaseModel):
    response: str
    model_used: str
    cost: float
    route: str
    settlement: str


# --- Endpoints ---


@app.get("/health")
async def health_check():
    """Simple health check endpoint."""
    return {
        "status": "healthy",
        "service": "budgetbot",
        "seller": SELLER,
        "chain": "Arc Testnet (5042002)",
        "timestamp": time.time(),
    }


# --- x402 Status ---


@app.get("/api/status")
async def api_status():
    """Public seller + network config for the dashboard."""
    return {
        "seller": SELLER,
        "network": NETWORK,
        "chainId": 5042002,
        "chainName": "Arc Testnet",
        "rpc": ARC_RPC,
        "prices": {"nano": "$0.000001", "helloWorld": "$0.01"},
        "endpoints": ["/nano", "/hello-world"],
        "explorer": ARC_EXPLORER,
        "time": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }


# --- x402 Paywall Endpoints ---


@app.get("/nano")
async def nano_endpoint(request: Request):
    """
    Nano resource — priced at $0.000001 USDC (1 atomic unit).
    This is the target the autonomous agent pays via x402.
    """
    payment_header = _parse_payment_header(request)
    if not payment_header:
        return _build_402_response("$0.000001", "/nano")

    result = await verify_payment(payment_header, "$0.000001")
    if not result.get("verified"):
        return JSONResponse(status_code=402, content={"error": "Payment verification failed", "detail": result.get("error")})

    return {
        "message": "nano resource — paid with a $0.000001 USDC nanopayment",
        "paid_by": result["payer"],
        "amount_usdc": "0.000001",
        "network": result["network"],
        "settlementId": result.get("transaction"),
    }


@app.get("/hello-world")
async def hello_world_endpoint(request: Request):
    """
    Hello World resource — priced at $0.01 USDC.
    Demonstrates a standard x402 paid endpoint.
    """
    payment_header = _parse_payment_header(request)
    if not payment_header:
        return _build_402_response("$0.01", "/hello-world")

    result = await verify_payment(payment_header, "$0.01")
    if not result.get("verified"):
        return JSONResponse(status_code=402, content={"error": "Payment verification failed", "detail": result.get("error")})

    return {
        "message": "hello, world — you paid for this",
        "paid_by": result["payer"],
        "amount_usdc": "0.01",
        "network": result["network"],
        "settlementId": result.get("transaction"),
    }


# --- Settlement / Transfer Endpoints ---


@app.get("/api/transfers")
async def get_transfers(limit: int = 10):
    """Recent settlements paid TO this seller — powers the dashboard live feed."""
    limit = min(max(limit, 1), 50)
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.get(
                f"{FACILITATOR_URL}/v1/x402/transfers",
                params={"to": SELLER, "pageSize": limit},
            )
            if r.status_code != 200:
                return {"transfers": []}
            data = r.json()
            return {"transfers": (data.get("transfers") or [])[:limit]}
    except Exception:
        return {"transfers": []}


@app.get("/api/settlement/{settlement_id}")
async def get_settlement(settlement_id: str):
    """Look up a single settlement by ID from Circle Gateway."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.get(f"{FACILITATOR_URL}/v1/x402/transfers/{settlement_id}")
            return JSONResponse(status_code=r.status_code, content=r.json())
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


@app.get("/api/batch-tx/{settlement_id}")
async def get_batch_tx(settlement_id: str):
    """Find the on-chain batch transaction for a settlement."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            sr = await client.get(f"{FACILITATOR_URL}/v1/x402/transfers/{settlement_id}")
            if sr.status_code != 200:
                raise HTTPException(status_code=sr.status_code, detail="Settlement not found")

            settlement = sr.json()
            status = settlement.get("status", "")

            if status not in ("completed", "confirmed"):
                return {"batchTx": None, "status": status}

            pinned = PINNED_BATCH_TX.get(settlement_id)
            if pinned:
                return {
                    "batchTx": pinned,
                    "status": status,
                    "explorerUrl": f"{ARC_EXPLORER}/tx/{pinned}",
                }

            tr = await client.get(
                f"{ARC_EXPLORER}/api/v2/addresses/{GATEWAY_WALLET}/transactions",
                params={"filter": "to"},
            )
            items = tr.json().get("items", [])

            from datetime import datetime
            updated_at_str = settlement.get("updatedAt", "")
            try:
                updated_at_ts = datetime.fromisoformat(updated_at_str.replace("Z", "+00:00")).timestamp() * 1000
            except Exception:
                updated_at_ts = 0

            candidate = None
            for t in items:
                if t.get("method") == "submitBatch":
                    try:
                        t_ts = datetime.fromisoformat(t["timestamp"].replace("Z", "+00:00")).timestamp() * 1000
                    except Exception:
                        continue
                    if t_ts <= updated_at_ts + 5000:
                        candidate = t
                        break

            return {
                "batchTx": candidate["hash"] if candidate else None,
                "status": status,
                "explorerUrl": f"{ARC_EXPLORER}/tx/{candidate['hash']}" if candidate else None,
            }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


@app.get("/v1/canvas-metrics")
async def get_canvas_metrics():
    """Return current canvas metrics for the frontend dashboard."""
    state = await canvas_state.get_state()
    wallet_address = os.getenv("AGENT_WALLET_ADDRESS", "0x...")

    # Calculate approximate USDC balance (budget - spend)
    budget = canvas_state.daily_budget
    usdc_balance = round(budget - state["daily_spend"], 4)

    return {
        "wallet_address": wallet_address,
        "usdc_balance": usdc_balance,
        "active_throughput": state["active_throughput"],
        "last_route": state["last_route"],
        "daily_spend": state["daily_spend"],
        "total_saved": state["total_saved"],
        "requests_today": state["requests_today"],
        "budget_remaining": state["budget_remaining"],
        "circuit_breaker": state["circuit_breaker"],
        "chain": "Arc Testnet (5042002)",
    }


@app.post("/v1/agent-route", response_model=AgentRouteResponse)
async def agent_route(request: AgentRouteRequest):
    """
    Route a prompt to the appropriate LLM tier based on priority and budget.
    Generates EIP-3009 authorization for gas-free settlement.
    """
    # Validate priority
    if request.priority not in ("low", "high"):
        raise HTTPException(status_code=400, detail="priority must be 'low' or 'high'")

    # Get routing decision
    decision: RouteDecision = await route_request(
        prompt=request.prompt,
        priority=request.priority,
        state=canvas_state,
    )

    # Attempt LLM call (or mock if no API key)
    openai_key = os.getenv("OPENAI_API_KEY", "")
    llm_response = ""

    if openai_key and not openai_key.startswith("sk-..."):
        # Real LLM call via OpenAI-compatible endpoint
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {openai_key}",
                        "Content-Type": "application/json",
                        "X-Circle-Gateway-Auth": decision.authorization_header,
                    },
                    json={
                        "model": decision.model,
                        "messages": [
                            {"role": "user", "content": request.prompt}
                        ],
                        "max_tokens": 256,
                    },
                )
                if resp.status_code == 200:
                    data = resp.json()
                    llm_response = data["choices"][0]["message"]["content"]
                else:
                    llm_response = f"[LLM returned {resp.status_code}] Routed to {decision.model} via {decision.route_name}"
        except Exception as e:
            llm_response = f"[LLM call failed: {str(e)}] Routed to {decision.model} via {decision.route_name}"
    else:
        # Mock response for development
        llm_response = (
            f"[Mock response] Request routed to {decision.model} "
            f"via {decision.route_name} tier. "
            f"Settlement: gas-free EIP-3009 on Arc Testnet. "
            f"Prompt: '{request.prompt[:50]}...'" if len(request.prompt) > 50
            else f"[Mock response] Request routed to {decision.model} "
            f"via {decision.route_name} tier. "
            f"Settlement: gas-free EIP-3009 on Arc Testnet. "
            f"Prompt: '{request.prompt}'"
        )

    # Calculate savings (savings only apply when routing to cheap tier)
    saved = SAVINGS_PER_CHEAP_CALL if decision.route_name == "cheap_tier" else 0.0

    # Record the request in state
    await canvas_state.record_request(
        route=decision.route_name,
        cost=decision.cost_per_call,
        saved=saved,
    )

    return AgentRouteResponse(
        response=llm_response,
        model_used=decision.model,
        cost=decision.cost_per_call,
        route=decision.route_name,
        settlement="gas-free-eip3009",
    )


@app.post("/v1/reset-daily")
async def reset_daily():
    """Reset daily spend counters (for testing)."""
    await canvas_state.reset_daily()
    return {
        "status": "reset",
        "message": "Daily counters have been reset",
        "daily_budget": canvas_state.daily_budget,
    }


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)
