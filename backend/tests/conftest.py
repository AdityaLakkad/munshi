import uuid
from collections.abc import AsyncGenerator, Callable, Awaitable

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c


@pytest.fixture
def make_tenant(client: AsyncClient) -> Callable[..., Awaitable[dict[str, str]]]:
    async def _make(firm_name: str = "Test Tenant") -> dict[str, str]:
        suffix = uuid.uuid4().hex[:8]
        resp = await client.post(
            "/api/v1/auth/signup",
            json={
                "firm_name": f"{firm_name} {suffix}",
                "admin_name": "Test Admin",
                "email": f"{suffix}@example.com",
                "password": "password123",
            },
        )
        resp.raise_for_status()
        token = resp.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}

    return _make


@pytest.fixture
async def auth_headers(make_tenant: Callable[..., Awaitable[dict[str, str]]]) -> dict[str, str]:
    return await make_tenant()
