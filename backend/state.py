"""Global canvas state manager for BudgetBot."""

import asyncio
import os
import time
from collections import deque
from typing import Optional


class CanvasState:
    """Thread-safe in-memory state manager with sliding window throughput tracking."""

    def __init__(self):
        self._lock = asyncio.Lock()
        self._daily_budget = float(os.getenv("DAILY_BUDGET_USD", "10.00"))
        self._active_throughput: float = 0.0
        self._last_route: str = "cheap_tier"
        self._daily_spend: float = 0.0
        self._total_saved: float = 0.0
        self._requests_today: int = 0
        self._last_request_ts: float = 0.0
        # Sliding window: store timestamps of requests in last 60 seconds
        self._request_timestamps: deque = deque()
        self._window_seconds: int = 60

    def _update_throughput(self):
        """Recalculate throughput based on sliding window of last 60 seconds."""
        now = time.time()
        # Remove timestamps older than the window
        while self._request_timestamps and (now - self._request_timestamps[0]) > self._window_seconds:
            self._request_timestamps.popleft()
        # Throughput = requests in window / window duration
        if self._request_timestamps:
            window_duration = now - self._request_timestamps[0]
            if window_duration > 0:
                self._active_throughput = len(self._request_timestamps) / min(window_duration, self._window_seconds)
            else:
                self._active_throughput = float(len(self._request_timestamps))
        else:
            self._active_throughput = 0.0

    async def record_request(self, route: str, cost: float, saved: float):
        """Record a completed request, updating all state counters."""
        async with self._lock:
            now = time.time()
            self._last_route = route
            self._daily_spend += cost
            self._total_saved += saved
            self._requests_today += 1
            self._last_request_ts = now
            self._request_timestamps.append(now)
            self._update_throughput()

    async def get_state(self) -> dict:
        """Return a snapshot of the current state."""
        async with self._lock:
            self._update_throughput()
            return {
                "active_throughput": round(self._active_throughput, 2),
                "last_route": self._last_route,
                "daily_spend": round(self._daily_spend, 4),
                "total_saved": round(self._total_saved, 4),
                "requests_today": self._requests_today,
                "last_request_ts": self._last_request_ts,
                "budget_remaining": round(self._daily_budget - self._daily_spend, 4),
                "circuit_breaker": self._daily_spend >= self._daily_budget,
            }

    async def reset_daily(self):
        """Reset daily counters (for testing or daily cron)."""
        async with self._lock:
            self._daily_spend = 0.0
            self._requests_today = 0
            self._last_request_ts = 0.0
            self._request_timestamps.clear()
            self._active_throughput = 0.0
            self._last_route = "cheap_tier"

    async def is_budget_exceeded(self) -> bool:
        """Check if the daily budget has been exceeded."""
        async with self._lock:
            return self._daily_spend >= self._daily_budget

    @property
    def daily_budget(self) -> float:
        return self._daily_budget
