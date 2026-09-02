import uuid
from collections.abc import Awaitable, Callable

import pytest
from httpx import AsyncClient


def _unique_email(prefix: str) -> str:
    return f"{prefix}-{uuid.uuid4().hex[:8]}@example.com"


@pytest.mark.asyncio
async def test_update_firm_profile(client: AsyncClient, auth_headers: dict[str, str]) -> None:
    resp = await client.patch(
        "/api/v1/tenants/me", json={"name": "Renamed Traders"}, headers=auth_headers
    )
    assert resp.status_code == 200
    assert resp.json()["name"] == "Renamed Traders"


@pytest.mark.asyncio
async def test_create_and_list_staff_user(client: AsyncClient, auth_headers: dict[str, str]) -> None:
    resp = await client.post(
        "/api/v1/users",
        json={"name": "Staff One", "email": _unique_email("staff-one"), "password": "password123", "role": "staff"},
        headers=auth_headers,
    )
    assert resp.status_code == 201
    assert resp.json()["role"] == "staff"

    resp = await client.get("/api/v1/users", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["total"] == 2  # firm_admin + new staff


@pytest.mark.asyncio
async def test_staff_cannot_manage_users_or_firm(
    client: AsyncClient, auth_headers: dict[str, str]
) -> None:
    email = _unique_email("staff-two")
    await client.post(
        "/api/v1/users",
        json={"name": "Staff Two", "email": email, "password": "password123", "role": "staff"},
        headers=auth_headers,
    )
    login = await client.post("/api/v1/auth/login", json={"email": email, "password": "password123"})
    staff_headers = {"Authorization": f"Bearer {login.json()['access_token']}"}

    resp = await client.get("/api/v1/users", headers=staff_headers)
    assert resp.status_code == 403

    resp = await client.patch("/api/v1/tenants/me", json={"name": "Hacked"}, headers=staff_headers)
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_cannot_remove_last_firm_admin(client: AsyncClient, auth_headers: dict[str, str]) -> None:
    me = await client.get("/api/v1/users/me", headers=auth_headers)
    admin_id = me.json()["id"]

    resp = await client.delete(f"/api/v1/users/{admin_id}", headers=auth_headers)
    assert resp.status_code == 400

    resp = await client.patch(f"/api/v1/users/{admin_id}", json={"role": "staff"}, headers=auth_headers)
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_change_own_password(client: AsyncClient, auth_headers: dict[str, str]) -> None:
    resp = await client.patch(
        "/api/v1/users/me/password",
        json={"current_password": "wrong", "new_password": "newpassword123"},
        headers=auth_headers,
    )
    assert resp.status_code == 400

    resp = await client.patch(
        "/api/v1/users/me/password",
        json={"current_password": "password123", "new_password": "newpassword123"},
        headers=auth_headers,
    )
    assert resp.status_code == 204


@pytest.mark.asyncio
async def test_user_management_tenant_isolation(
    client: AsyncClient,
    auth_headers: dict[str, str],
    make_tenant: Callable[..., Awaitable[dict[str, str]]],
) -> None:
    await client.post(
        "/api/v1/users",
        json={"name": "Tenant A Staff", "email": _unique_email("tenant-a-staff"), "password": "password123", "role": "staff"},
        headers=auth_headers,
    )

    other_headers = await make_tenant("Other Tenant")
    resp = await client.get("/api/v1/users", headers=other_headers)
    assert resp.status_code == 200
    assert resp.json()["total"] == 1  # only the other tenant's own firm_admin
