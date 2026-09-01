from collections.abc import Awaitable, Callable

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_cashbook_report_csv(client: AsyncClient, auth_headers: dict[str, str]) -> None:
    resp = await client.post(
        "/api/v1/cashbook",
        json={"entry_date": "2026-01-01", "type": "credit", "amount": "100.00", "mode": "cash"},
        headers=auth_headers,
    )
    assert resp.status_code == 201

    resp = await client.get("/api/v1/reports/cashbook?format=csv", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.headers["content-type"].startswith("text/csv")
    body = resp.text
    assert "Date,Type,Amount,Mode,Category,Remarks" in body
    assert "100.00" in body


@pytest.mark.asyncio
async def test_unknown_report_404(client: AsyncClient, auth_headers: dict[str, str]) -> None:
    resp = await client.get("/api/v1/reports/not-a-real-report", headers=auth_headers)
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_report_tenant_isolation(
    client: AsyncClient,
    auth_headers: dict[str, str],
    make_tenant: Callable[..., Awaitable[dict[str, str]]],
) -> None:
    resp = await client.post(
        "/api/v1/cashbook",
        json={"entry_date": "2026-01-01", "type": "credit", "amount": "777.00", "mode": "cash"},
        headers=auth_headers,
    )
    assert resp.status_code == 201

    other_headers = await make_tenant("Other Report Tenant")
    resp = await client.get("/api/v1/reports/cashbook?format=csv", headers=other_headers)
    assert resp.status_code == 200
    assert "777.00" not in resp.text
