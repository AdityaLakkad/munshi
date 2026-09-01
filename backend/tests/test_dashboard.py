from collections.abc import Awaitable, Callable

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_dashboard_summary(client: AsyncClient, auth_headers: dict[str, str]) -> None:
    resp = await client.post(
        "/api/v1/cashbook",
        json={"entry_date": "2026-01-01", "type": "credit", "amount": "500.00", "mode": "cash"},
        headers=auth_headers,
    )
    assert resp.status_code == 201

    resp = await client.get("/api/v1/dashboard", headers=auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["cash_in_hand"] == "500.00"
    assert body["bank_balance"] == "0"
    assert len(body["recent_transactions"]) == 1


@pytest.mark.asyncio
async def test_dashboard_tenant_isolation(
    client: AsyncClient,
    auth_headers: dict[str, str],
    make_tenant: Callable[..., Awaitable[dict[str, str]]],
) -> None:
    resp = await client.post(
        "/api/v1/cashbook",
        json={"entry_date": "2026-01-01", "type": "credit", "amount": "999.00", "mode": "cash"},
        headers=auth_headers,
    )
    assert resp.status_code == 201

    other_headers = await make_tenant("Other Dashboard Tenant")
    resp = await client.get("/api/v1/dashboard", headers=other_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["cash_in_hand"] == "0"
    assert body["recent_transactions"] == []
