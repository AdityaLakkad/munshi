from collections.abc import Awaitable, Callable

import pytest
from httpx import AsyncClient


async def _make_customer(client: AsyncClient, headers: dict[str, str], name: str = "Test Customer") -> str:
    resp = await client.post("/api/v1/customers", json={"name": name}, headers=headers)
    assert resp.status_code == 201
    return resp.json()["id"]


@pytest.mark.asyncio
async def test_sales_entry_and_payment_creates_cashbook_entry(
    client: AsyncClient, auth_headers: dict[str, str]
) -> None:
    customer_id = await _make_customer(client, auth_headers)

    resp = await client.post(
        "/api/v1/sales/entries",
        json={"entry_date": "2026-01-01", "customer_id": customer_id, "item_desc": "Widget", "qty": 2, "rate": "50.00"},
        headers=auth_headers,
    )
    assert resp.status_code == 201
    assert resp.json()["total_amount"] == "100.00"

    resp = await client.post(
        "/api/v1/sales/payments",
        json={"entry_date": "2026-01-02", "customer_id": customer_id, "amount": "40.00", "mode": "cash"},
        headers=auth_headers,
    )
    assert resp.status_code == 201
    payment_id = resp.json()["id"]

    resp = await client.get("/api/v1/cashbook?type=sales_payment", headers=auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] == 1
    assert body["items"][0]["linked_ref_id"] == payment_id
    assert body["items"][0]["amount"] == "40.00"

    resp = await client.get("/api/v1/sales/outstanding", headers=auth_headers)
    assert resp.status_code == 200
    outstanding = resp.json()["items"]
    assert len(outstanding) == 1
    assert outstanding[0]["outstanding"] == "60.00"


@pytest.mark.asyncio
async def test_sales_tenant_isolation(
    client: AsyncClient,
    auth_headers: dict[str, str],
    make_tenant: Callable[..., Awaitable[dict[str, str]]],
) -> None:
    customer_id = await _make_customer(client, auth_headers)
    resp = await client.post(
        "/api/v1/sales/entries",
        json={"entry_date": "2026-01-01", "customer_id": customer_id, "qty": 1, "rate": "10.00"},
        headers=auth_headers,
    )
    assert resp.status_code == 201

    other_headers = await make_tenant("Other Sales Tenant")
    resp = await client.get("/api/v1/sales/entries", headers=other_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] == 0

    # tenant B cannot create a sales entry against tenant A's customer
    resp = await client.post(
        "/api/v1/sales/entries",
        json={"entry_date": "2026-01-01", "customer_id": customer_id, "qty": 1, "rate": "10.00"},
        headers=other_headers,
    )
    assert resp.status_code == 404
