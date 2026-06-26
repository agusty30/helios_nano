"""LLM routing logic for BudgetBot — multi-provider routing with priority-based tier selection."""

import os
from dataclasses import dataclass
from typing import Optional

import httpx
from fastapi import HTTPException
from pydantic import BaseModel

from circle_gateway import generate_eip3009_auth
from state import CanvasState


class RouteDecision(BaseModel):
    model: str
    cost_per_call: float
    route_name: str
    authorization_header: str
    provider: str


# --- Provider definitions ---

@dataclass
class LLMProvider:
    name: str
    api_key_env: str
    base_url: str
    auth_prefix: str
    cheap_model: str
    heavy_model: str

PROVIDERS: list[LLMProvider] = [
    LLMProvider(
        name="openai",
        api_key_env="OPENAI_API_KEY",
        base_url="https://api.openai.com/v1",
        auth_prefix="Bearer",
        cheap_model="gpt-4o-mini",
        heavy_model="gpt-4o",
    ),
    LLMProvider(
        name="anthropic",
        api_key_env="ANTHROPIC_API_KEY",
        base_url="https://api.anthropic.com/v1",
        auth_prefix="x-api-key",
        cheap_model="claude-haiku-4-5-20251001",
        heavy_model="claude-sonnet-4-6-20250610",
    ),
    LLMProvider(
        name="openrouter",
        api_key_env="OPENROUTER_API_KEY",
        base_url="https://openrouter.ai/api/v1",
        auth_prefix="Bearer",
        cheap_model="google/gemini-2.0-flash-exp:free",
        heavy_model="anthropic/claude-sonnet-4",
    ),
]

# Pricing tiers (USD per call estimate)
HEAVY_TIER_COST = 0.05
CHEAP_TIER_COST = 0.0008
SAVINGS_PER_CHEAP_CALL = HEAVY_TIER_COST - CHEAP_TIER_COST


def get_active_provider() -> tuple[LLMProvider, str] | None:
    """Find the first provider with a configured API key."""
    for p in PROVIDERS:
        key = os.getenv(p.api_key_env, "")
        if key and not key.startswith("sk-...") and not key.startswith("placeholder"):
            return p, key
    return None


async def call_llm(provider: LLMProvider, api_key: str, model: str, prompt: str) -> str:
    """Call the LLM provider's chat completions endpoint."""
    if provider.name == "anthropic":
        return await _call_anthropic(api_key, model, prompt)
    return await _call_openai_compatible(provider, api_key, model, prompt)


async def _call_openai_compatible(provider: LLMProvider, api_key: str, model: str, prompt: str) -> str:
    """Call OpenAI-compatible API (OpenAI, OpenRouter)."""
    headers = {
        "Authorization": f"{provider.auth_prefix} {api_key}",
        "Content-Type": "application/json",
    }
    if provider.name == "openrouter":
        headers["HTTP-Referer"] = "https://budgetbot.app"
        headers["X-Title"] = "BudgetBot"

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(
            f"{provider.base_url}/chat/completions",
            headers=headers,
            json={
                "model": model,
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": 512,
            },
        )
        if resp.status_code == 200:
            data = resp.json()
            return data["choices"][0]["message"]["content"]
        raise Exception(f"{provider.name} returned {resp.status_code}: {resp.text[:200]}")


async def _call_anthropic(api_key: str, model: str, prompt: str) -> str:
    """Call Anthropic Messages API (different format from OpenAI)."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": api_key,
                "anthropic-version": "2023-06-01",
                "Content-Type": "application/json",
            },
            json={
                "model": model,
                "max_tokens": 512,
                "messages": [{"role": "user", "content": prompt}],
            },
        )
        if resp.status_code == 200:
            data = resp.json()
            return data["content"][0]["text"]
        raise Exception(f"anthropic returned {resp.status_code}: {resp.text[:200]}")


async def route_request(prompt: str, priority: str, state: CanvasState) -> RouteDecision:
    """Route an incoming request to the appropriate LLM tier based on priority and budget."""
    if await state.is_budget_exceeded():
        raise HTTPException(status_code=429, detail="circuit_breaker_tripped")

    current_state = await state.get_state()
    daily_spend = current_state["daily_spend"]
    budget = state.daily_budget

    gateway_address = os.getenv(
        "GATEWAY_RECIPIENT_ADDRESS",
        "0x0000000000000000000000000000000000000001",
    )

    active = get_active_provider()
    if active:
        provider, api_key = active
    else:
        provider = PROVIDERS[0]
        api_key = ""

    if priority == "high" and daily_spend < budget * 0.8:
        model = provider.heavy_model
        cost = HEAVY_TIER_COST
        route_name = "heavy_tier"
    else:
        model = provider.cheap_model
        cost = CHEAP_TIER_COST
        route_name = "cheap_tier"

    try:
        auth_header = generate_eip3009_auth(to_address=gateway_address, amount_usdc=cost)
    except ValueError:
        auth_header = "dev-mode-no-auth"

    return RouteDecision(
        model=model,
        cost_per_call=cost,
        route_name=route_name,
        authorization_header=auth_header,
        provider=provider.name,
    )
