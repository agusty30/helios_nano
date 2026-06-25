"""FastAPI application for BudgetBot — autonomous AI API routing agent."""

import os
import time
from contextlib import asynccontextmanager

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from router import route_request, RouteDecision, HEAVY_TIER_COST, CHEAP_TIER_COST, SAVINGS_PER_CHEAP_CALL
from state import CanvasState


# Load environment variables
load_dotenv()

# Global state instance
canvas_state = CanvasState()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: startup and shutdown events."""
    # Startup
    print(f"BudgetBot starting on port {os.getenv('PORT', '8000')}")
    print(f"Daily budget: ${canvas_state.daily_budget:.2f}")
    print(f"Wallet: {os.getenv('AGENT_WALLET_ADDRESS', 'not configured')}")
    print(f"Chain: Arc Testnet (5042002)")
    yield
    # Shutdown
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
        "timestamp": time.time(),
    }


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
