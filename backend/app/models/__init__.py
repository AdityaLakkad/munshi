# Import all models here so Alembic autogenerate can discover them.
from app.models.tenant import Tenant  # noqa: F401
from app.models.user import User  # noqa: F401
from app.models.customer import Customer  # noqa: F401
from app.models.supplier import Supplier  # noqa: F401
from app.models.employee import Employee  # noqa: F401
from app.models.item import Item  # noqa: F401
from app.models.cashbook import CashbookEntry  # noqa: F401
from app.models.sales import SalesEntry, SalesPayment  # noqa: F401
from app.models.purchases import PurchaseEntry, PurchasePayment  # noqa: F401
from app.models.salary import SalaryPayment, AdvanceSalary  # noqa: F401
