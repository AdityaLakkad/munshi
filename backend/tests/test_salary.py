from collections.abc import Awaitable, Callable

import pytest
from httpx import AsyncClient


async def _make_employee(client: AsyncClient, headers: dict[str, str], name: str = "Test Employee") -> str:
    resp = await client.post(
        "/api/v1/employees", json={"name": name, "monthly_salary": "20000.00"}, headers=headers
    )
    assert resp.status_code == 201
    return resp.json()["id"]


@pytest.mark.asyncio
async def test_salary_and_advance_create_cashbook_outflows_and_ledger(
    client: AsyncClient, auth_headers: dict[str, str]
) -> None:
    employee_id = await _make_employee(client, auth_headers)

    resp = await client.post(
        "/api/v1/employees/salary",
        json={
            "entry_date": "2026-02-01",
            "employee_id": employee_id,
            "period_month": "2026-01-15",
            "amount": "20000.00",
            "mode": "bank",
        },
        headers=auth_headers,
    )
    assert resp.status_code == 201
    assert resp.json()["period_month"] == "2026-01-01"

    resp = await client.post(
        "/api/v1/employees/advance",
        json={"entry_date": "2026-01-10", "employee_id": employee_id, "amount": "1000.00"},
        headers=auth_headers,
    )
    assert resp.status_code == 201
    advance_id = resp.json()["id"]
    assert resp.json()["adjusted_status"] == "pending"

    resp = await client.patch(
        f"/api/v1/employees/advance/{advance_id}",
        json={"adjusted_status": "adjusted"},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["adjusted_status"] == "adjusted"

    resp = await client.get("/api/v1/cashbook?type=salary", headers=auth_headers)
    assert resp.json()["items"][0]["amount"] == "-20000.00"
    resp = await client.get("/api/v1/cashbook?type=advance_salary", headers=auth_headers)
    assert resp.json()["items"][0]["amount"] == "-1000.00"

    resp = await client.get(f"/api/v1/employees/{employee_id}/ledger", headers=auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["total_salary_paid"] == "20000.00"
    assert body["total_advances_given"] == "1000.00"
    assert body["advances_outstanding"] == "0.00"
    assert len(body["entries"]) == 2


@pytest.mark.asyncio
async def test_salary_tenant_isolation(
    client: AsyncClient,
    auth_headers: dict[str, str],
    make_tenant: Callable[..., Awaitable[dict[str, str]]],
) -> None:
    employee_id = await _make_employee(client, auth_headers)
    resp = await client.post(
        "/api/v1/employees/salary",
        json={
            "entry_date": "2026-01-01",
            "employee_id": employee_id,
            "period_month": "2026-01-01",
            "amount": "5000.00",
            "mode": "cash",
        },
        headers=auth_headers,
    )
    assert resp.status_code == 201

    other_headers = await make_tenant("Other Salary Tenant")
    resp = await client.get("/api/v1/employees/salary", headers=other_headers)
    assert resp.status_code == 200
    assert resp.json()["total"] == 0

    resp = await client.get(f"/api/v1/employees/{employee_id}/ledger", headers=other_headers)
    assert resp.status_code == 404
