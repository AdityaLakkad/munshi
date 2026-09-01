"""
Seeds one demo tenant with a full working dataset — customers, suppliers,
employees, cashbook entries, a sale + payment, a purchase + payment, a
salary payment, and an advance — so the app can be clicked through end to
end without filling in every form by hand first.

Gated by SEED_DEMO_DATA=true (see app/core/config.py). Wired into
app/main.py's startup lifespan, and also runnable standalone:

    docker compose exec api python -m app.db.seed

Idempotent: skips entirely if the demo tenant already exists.
"""
import asyncio
import logging
from datetime import date, timedelta
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.db.session import AsyncSessionLocal
from app.models.cashbook import CashbookType, PaymentMode
from app.models.customer import Customer
from app.models.employee import Employee
from app.models.purchases import PurchaseEntry, PurchasePayment
from app.models.salary import AdvanceSalary, SalaryPayment
from app.models.sales import SalesEntry, SalesPayment
from app.models.supplier import Supplier
from app.models.tenant import Tenant
from app.models.user import User, UserRole
from app.services.cashbook import create_cashbook_entry

logger = logging.getLogger(__name__)

DEMO_TENANT_SLUG = "demo-traders"
DEMO_ADMIN_EMAIL = "demo@munshitraders.com"
DEMO_ADMIN_PASSWORD = "password123"


async def seed_demo_data() -> None:
    async with AsyncSessionLocal() as db:
        existing = await db.execute(select(Tenant).where(Tenant.slug == DEMO_TENANT_SLUG))
        if existing.scalar_one_or_none() is not None:
            logger.info("Demo tenant '%s' already exists — skipping seed.", DEMO_TENANT_SLUG)
            return

        logger.info("SEED_DEMO_DATA is on — creating demo tenant and sample data...")
        await _create_demo_data(db)
        logger.info("Demo data seeded. Log in with %s / %s", DEMO_ADMIN_EMAIL, DEMO_ADMIN_PASSWORD)


async def _create_demo_data(db: AsyncSession) -> None:
    tenant = Tenant(name="Demo Traders", slug=DEMO_TENANT_SLUG, currency="INR")
    db.add(tenant)
    await db.flush()

    admin = User(
        tenant_id=tenant.id,
        name="Demo Admin",
        email=DEMO_ADMIN_EMAIL,
        password_hash=hash_password(DEMO_ADMIN_PASSWORD),
        role=UserRole.firm_admin,
    )
    db.add(admin)
    await db.flush()

    customers = [
        Customer(tenant_id=tenant.id, name="Rohit Traders", phone="9800000001", address="MG Road"),
        Customer(tenant_id=tenant.id, name="Sunrise Retail", phone="9800000002", address="Park Street"),
    ]
    suppliers = [
        Supplier(tenant_id=tenant.id, name="Ganesh Wholesale", phone="9800000011", address="Industrial Area"),
        Supplier(tenant_id=tenant.id, name="Metro Suppliers", phone="9800000012", address="Sector 5"),
    ]
    employees = [
        Employee(
            tenant_id=tenant.id,
            name="Anita Sharma",
            designation="Accountant",
            monthly_salary=Decimal("25000"),
            joining_date=date.today() - timedelta(days=200),
            status="active",
        ),
        Employee(
            tenant_id=tenant.id,
            name="Vikram Singh",
            designation="Sales Executive",
            monthly_salary=Decimal("18000"),
            joining_date=date.today() - timedelta(days=90),
            status="active",
        ),
    ]
    db.add_all(customers + suppliers + employees)
    await db.flush()

    today = date.today()
    last_month_start = (today.replace(day=1) - timedelta(days=1)).replace(day=1)

    await create_cashbook_entry(
        db, tenant_id=tenant.id, entry_date=today - timedelta(days=20), type=CashbookType.credit,
        amount=Decimal("50000"), mode=PaymentMode.cash, created_by=admin.id, category="Opening Balance",
    )
    await create_cashbook_entry(
        db, tenant_id=tenant.id, entry_date=today - timedelta(days=15), type=CashbookType.debit,
        amount=Decimal("-3000"), mode=PaymentMode.cash, created_by=admin.id, category="Rent",
    )

    out_entry = await create_cashbook_entry(
        db, tenant_id=tenant.id, entry_date=today - timedelta(days=10), type=CashbookType.transfer,
        amount=Decimal("-10000"), mode=PaymentMode.cash, created_by=admin.id, linked_ref_type="transfer",
    )
    transfer_id = out_entry.id
    await create_cashbook_entry(
        db, tenant_id=tenant.id, entry_date=today - timedelta(days=10), type=CashbookType.transfer,
        amount=Decimal("10000"), mode=PaymentMode.bank, created_by=admin.id,
        linked_ref_type="transfer", linked_ref_id=transfer_id,
    )

    sale = SalesEntry(
        tenant_id=tenant.id, entry_date=today - timedelta(days=7), customer_id=customers[0].id,
        item_desc="Notebook", qty=Decimal("20"), rate=Decimal("50"), total_amount=Decimal("1000"),
        created_by=admin.id,
    )
    db.add(sale)
    await db.flush()
    sales_payment = SalesPayment(
        tenant_id=tenant.id, entry_date=today - timedelta(days=5), customer_id=customers[0].id,
        sales_entry_id=sale.id, amount=Decimal("400"), mode=PaymentMode.cash, created_by=admin.id,
    )
    db.add(sales_payment)
    await db.flush()
    await create_cashbook_entry(
        db, tenant_id=tenant.id, entry_date=sales_payment.entry_date, type=CashbookType.sales_payment,
        amount=sales_payment.amount, mode=PaymentMode.cash, created_by=admin.id,
        linked_ref_type="sales_payment", linked_ref_id=sales_payment.id,
    )

    purchase = PurchaseEntry(
        tenant_id=tenant.id, entry_date=today - timedelta(days=6), supplier_id=suppliers[0].id,
        item_desc="Raw material", qty=Decimal("10"), rate=Decimal("200"), total_amount=Decimal("2000"),
        created_by=admin.id,
    )
    db.add(purchase)
    await db.flush()
    purchase_payment = PurchasePayment(
        tenant_id=tenant.id, entry_date=today - timedelta(days=4), supplier_id=suppliers[0].id,
        purchase_entry_id=purchase.id, amount=Decimal("1200"), mode=PaymentMode.bank, created_by=admin.id,
    )
    db.add(purchase_payment)
    await db.flush()
    await create_cashbook_entry(
        db, tenant_id=tenant.id, entry_date=purchase_payment.entry_date, type=CashbookType.purchase_payment,
        amount=-purchase_payment.amount, mode=PaymentMode.bank, created_by=admin.id,
        linked_ref_type="purchase_payment", linked_ref_id=purchase_payment.id,
    )

    salary = SalaryPayment(
        tenant_id=tenant.id, entry_date=today - timedelta(days=2), employee_id=employees[0].id,
        period_month=last_month_start, amount=Decimal("25000"), mode=PaymentMode.bank, created_by=admin.id,
    )
    db.add(salary)
    await db.flush()
    await create_cashbook_entry(
        db, tenant_id=tenant.id, entry_date=salary.entry_date, type=CashbookType.salary,
        amount=-salary.amount, mode=PaymentMode.bank, created_by=admin.id,
        linked_ref_type="salary_payment", linked_ref_id=salary.id,
    )

    advance = AdvanceSalary(
        tenant_id=tenant.id, entry_date=today - timedelta(days=3), employee_id=employees[1].id,
        amount=Decimal("2000"), adjusted_status="pending", created_by=admin.id,
    )
    db.add(advance)
    await db.flush()
    await create_cashbook_entry(
        db, tenant_id=tenant.id, entry_date=advance.entry_date, type=CashbookType.advance_salary,
        amount=-advance.amount, mode=PaymentMode.cash, created_by=admin.id,
        linked_ref_type="advance_salary", linked_ref_id=advance.id,
    )

    await db.commit()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(seed_demo_data())
