from fastapi import APIRouter

from app.api.v1 import (
    auth,
    cashbook,
    customers,
    dashboard,
    employees,
    purchases,
    reports,
    sales,
    search,
    suppliers,
    users,
)

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(customers.router, prefix="/customers", tags=["customers"])
api_router.include_router(suppliers.router, prefix="/suppliers", tags=["suppliers"])
api_router.include_router(employees.router, prefix="/employees", tags=["employees"])
api_router.include_router(cashbook.router, prefix="/cashbook", tags=["cashbook"])
api_router.include_router(sales.router, prefix="/sales", tags=["sales"])
api_router.include_router(purchases.router, prefix="/purchases", tags=["purchases"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
api_router.include_router(search.router, prefix="/search", tags=["search"])
