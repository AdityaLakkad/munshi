from collections.abc import Awaitable, Callable

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_entry_and_running_balance(client: AsyncClient, auth_headers: dict[str, str]) -> None:
    resp = await client.post(
        "/api/v1/cashbook",
        json={"entry_date": "2026-01-01", "type": "credit", "amount": "1000.00", "mode": "cash"},
        headers=auth_headers,
    )
    assert resp.status_code == 201
    assert resp.json()["amount"] == "1000.00"

    resp = await client.post(
        "/api/v1/cashbook",
        json={"entry_date": "2026-01-02", "type": "debit", "amount": "300.00", "mode": "cash"},
        headers=auth_headers,
    )
    assert resp.status_code == 201
    assert resp.json()["amount"] == "-300.00"

    resp = await client.get("/api/v1/cashbook", headers=auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] == 2
    assert body["items"][0]["running_balance"] == "1000.00"
    assert body["items"][1]["running_balance"] == "700.00"


@pytest.mark.asyncio
async def test_transfer_requires_different_modes(client: AsyncClient, auth_headers: dict[str, str]) -> None:
    resp = await client.post(
        "/api/v1/cashbook/transfer",
        json={"entry_date": "2026-01-01", "from_mode": "cash", "to_mode": "cash", "amount": "50.00"},
        headers=auth_headers,
    )
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_cashbook_tenant_isolation(
    client: AsyncClient,
    auth_headers: dict[str, str],
    make_tenant: Callable[..., Awaitable[dict[str, str]]],
) -> None:
    resp = await client.post(
        "/api/v1/cashbook",
        json={"entry_date": "2026-01-01", "type": "credit", "amount": "500.00", "mode": "cash"},
        headers=auth_headers,
    )
    assert resp.status_code == 201

    other_headers = await make_tenant("Other Cashbook Tenant")
    resp = await client.get("/api/v1/cashbook", headers=other_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] == 0
    assert body["items"] == []
