"""LLM routing logic for BudgetBot — routes requests based on priority and budget."""

import os
from typing import Optional

from fastapi import HTTPException
from pydantic import BaseModel

from circle_gateway import generate_eip3009_auth
from state import CanvasState


class RouteDecision(BaseModel):
    """Pydantic model representing a routing decision."""
    model: str
    cost_per_call: float
    route_name: str
    authorization_header: str


# Pricing tiers
HEAVY_TIER_MODEL = "gpt-4.5-preview"
HEAVY_TIER_COST = 0.05

CHEAP_TIER_MODEL = "gpt-4o-mini"
CHEAP_TIER_COST = 0.0008

# Cost savings estimate: difference between what heavy would cost and what cheap costs
SAVINGS_PER_CHEAP_CALL = HEAVY_TIER_COST - CHEAP_TIER_COST


async def route_request(prompt: str, priority: str, state: CanvasState) -> RouteDecision:
    """
    Route an incoming request to the appropriate LLM tier based on priority and budget.

    Args:
        prompt: The user's prompt text.
        priority: "high" or "low" priority level.
        state: The global CanvasState instance.

    Returns:
        RouteDecision with model, cost, route name, and authorization header.

    Raises:
        HTTPException(429): If daily budget is exceeded (circuit breaker tripped).
    """
    # Check circuit breaker
    if await state.is_budget_exceeded():
        raise HTTPException(
            status_code=429,
            detail="circuit_breaker_tripped"
        )

    # Get current state for budget calculation
    current_state = await state.get_state()
    daily_spend = current_state["daily_spend"]
    budget = state.daily_budget

    # Determine the gateway recipient (Circle Gateway API endpoint)
    gateway_address = os.getenv(
        "GATEWAY_RECIPIENT_ADDRESS",
        "0x0000000000000000000000000000000000000001"  # Placeholder for testnet
    )

    # Routing logic
    if priority == "high" and daily_spend < budget * 0.8:
        # Route to heavy tier if high priority and budget allows
        model = HEAVY_TIER_MODEL
        cost = HEAVY_TIER_COST
        route_name = "heavy_tier"
    else:
        # Default to cheap tier
        model = CHEAP_TIER_MODEL
        cost = CHEAP_TIER_COST
        route_name = "cheap_tier"

    # Generate EIP-3009 authorization for the cost amount
    try:
        auth_header = generate_eip3009_auth(
            to_address=gateway_address,
            amount_usdc=cost,
        )
    except ValueError:
        # If auth generation fails (e.g., no private key in dev), use a placeholder
        auth_header = "dev-mode-no-auth"

    return RouteDecision(
        model=model,
        cost_per_call=cost,
        route_name=route_name,
        authorization_header=auth_header,
    )
