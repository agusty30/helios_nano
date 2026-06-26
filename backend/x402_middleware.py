"""x402 protocol middleware for FastAPI — HTTP 402 Payment Required with Circle Gateway."""

import json
import base64
from typing import Optional, Callable, Awaitable

import httpx
from fastapi import Request, Response
from fastapi.responses import JSONResponse


SELLER = "0x933a2405f84c224be1ef373ba16e992e1f459682"
FACILITATOR_URL = "https://gateway-api-testnet.circle.com"
NETWORK = "eip155:5042002"


def _parse_payment_header(request: Request) -> Optional[str]:
    """Extract x402 payment payload from request headers."""
    return request.headers.get("x-payment") or request.headers.get("authorization")


def _build_402_response(price: str, resource: str) -> JSONResponse:
    """Return 402 with payment requirements per the x402 spec."""
    return JSONResponse(
        status_code=402,
        content={
            "accepts": [
                {
                    "scheme": "exact",
                    "network": NETWORK,
                    "maxAmountRequired": price,
                    "resource": resource,
                    "description": f"Pay {price} USDC to access {resource}",
                    "payTo": SELLER,
                    "mimeType": "application/json",
                    "outputSchema": None,
                    "extra": {
                        "name": "USDC",
                        "version": "1",
                    },
                }
            ],
            "error": "X-PAYMENT header is required. Use a x402-enabled HTTP client.",
        },
    )


async def verify_payment(payment_header: str, price: str) -> dict:
    """
    Verify and settle a payment via Circle Gateway facilitator.

    Sends the payment authorization to the facilitator for verification.
    On success, returns payment details (payer, amount, network, transaction).
    On failure, raises an exception.
    """
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                f"{FACILITATOR_URL}/v1/x402/verify",
                json={
                    "payload": payment_header,
                    "sellerAddress": SELLER,
                    "network": NETWORK,
                    "price": price,
                },
            )
            if resp.status_code == 200:
                data = resp.json()
                return {
                    "verified": True,
                    "payer": data.get("payer", "unknown"),
                    "amount": data.get("amount", price),
                    "network": data.get("network", NETWORK),
                    "transaction": data.get("transaction"),
                }
            else:
                return {"verified": False, "error": f"Facilitator returned {resp.status_code}"}
    except Exception as e:
        return {"verified": False, "error": str(e)}


def usdc_to_atomic(price_str: str) -> str:
    """Convert '$0.01' or '0.01' to atomic units string '10000'."""
    clean = price_str.replace("$", "").strip()
    return str(int(float(clean) * 1_000_000))
