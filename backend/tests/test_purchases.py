from collections.abc import Awaitable, Callable

import pytest
from httpx import AsyncClient


async def _make_supplier(client: AsyncClient, headers: dict[str, str], name: str = "Test Supplier") -> str:
    resp = await client.post("/api/v1/suppliers", json={"name": name}, headers=headers)
    assert resp.status_code == 201
    return resp.json()["id"]


@pytest.mark.asyncio
async def test_purchase_entry_and_payment_creates_cashbook_outflow(
    client: AsyncClient, auth_headers: dict[str, str]
) -> None:
    supplier_id = await _make_supplier(client, auth_headers)

    resp = await client.post(
        "/api/v1/purchases/entries",
        json={"entry_date": "2026-01-01", "supplier_id": supplier_id, "item_desc": "Raw material", "qty": 5, "rate": "20.00"},
        headers=auth_headers,
    )
    assert resp.status_code == 201
    assert resp.json()["total_amount"] == "100.00"

    resp = await client.post(
        "/api/v1/purchases/payments",
        json={"entry_date": "2026-01-02", "supplier_id": supplier_id, "amount": "30.00", "mode": "bank"},
        headers=auth_headers,
    )
    assert resp.status_code == 201
    payment_id = resp.json()["id"]

    resp = await client.get("/api/v1/cashbook?type=purchase_payment", headers=auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] == 1
    assert body["items"][0]["linked_ref_id"] == payment_id
    assert body["items"][0]["amount"] == "-30.00"

    resp = await client.get("/api/v1/purchases/outstanding", headers=auth_headers)
    assert resp.status_code == 200
    outstanding = resp.json()["items"]
    assert len(outstanding) == 1
    assert outstanding[0]["outstanding"] == "70.00"


@pytest.mark.asyncio
async def test_purchases_tenant_isolation(
    client: AsyncClient,
    auth_headers: dict[str, str],
    make_tenant: Callable[..., Awaitable[dict[str, str]]],
) -> None:
    supplier_id = await _make_supplier(client, auth_headers)
    resp = await client.post(
        "/api/v1/purchases/entries",
        json={"entry_date": "2026-01-01", "supplier_id": supplier_id, "qty": 1, "rate": "10.00"},
        headers=auth_headers,
    )
    assert resp.status_code == 201

    other_headers = await make_tenant("Other Purchases Tenant")
    resp = await client.get("/api/v1/purchases/entries", headers=other_headers)
    assert resp.status_code == 200
    assert resp.json()["total"] == 0

    resp = await client.post(
        "/api/v1/purchases/entries",
        json={"entry_date": "2026-01-01", "supplier_id": supplier_id, "qty": 1, "rate": "10.00"},
        headers=other_headers,
    )
    assert resp.status_code == 404
