"""
Shared FastAPI dependencies — most importantly get_current_user / get_current_tenant.

RULE: any endpoint that reads or writes business data (customers, suppliers,
employees, cashbook, sales, purchases, salary) MUST depend on
get_current_tenant and filter its query by that tenant_id. Never accept
tenant_id from the request body or query params.
"""
import uuid
from collections.abc import AsyncGenerator

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_token
from app.db.session import get_db
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_token(token)
        if payload.get("type") != "access":
            raise credentials_exception
        user_id = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user = result.scalar_one_or_none()
    if user is None:
        raise credentials_exception
    return user


async def get_current_tenant(user: User = Depends(get_current_user)) -> uuid.UUID:
    """
    Returns the tenant_id every business-data query must filter by.
    Raises if the user has no tenant (e.g. a super_admin hitting a
    tenant-scoped endpoint by mistake).
    """
    if user.tenant_id is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This endpoint requires a tenant-scoped user.",
        )
    return user.tenant_id
