from collections.abc import Awaitable, Callable

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_and_list_customer(client: AsyncClient, auth_headers: dict[str, str]) -> None:
    resp = await client.post(
        "/api/v1/customers", json={"name": "Acme Corp", "phone": "123"}, headers=auth_headers
    )
    assert resp.status_code == 201
    assert resp.json()["name"] == "Acme Corp"

    resp = await client.get("/api/v1/customers", headers=auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] == 1
    assert body["items"][0]["name"] == "Acme Corp"


@pytest.mark.asyncio
async def test_customer_tenant_isolation(
    client: AsyncClient,
    auth_headers: dict[str, str],
    make_tenant: Callable[..., Awaitable[dict[str, str]]],
) -> None:
    resp = await client.post(
        "/api/v1/customers", json={"name": "Tenant A Customer"}, headers=auth_headers
    )
    assert resp.status_code == 201

    other_headers = await make_tenant("Other Tenant")
    resp = await client.get("/api/v1/customers", headers=other_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] == 0
    assert body["items"] == []
