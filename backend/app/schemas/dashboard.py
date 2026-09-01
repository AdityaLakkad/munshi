from decimal import Decimal

from pydantic import BaseModel

from app.schemas.cashbook import CashbookEntryOut


class DashboardSummary(BaseModel):
    cash_in_hand: Decimal
    bank_balance: Decimal
    total_sales_this_month: Decimal
    total_purchases_this_month: Decimal
    total_receivable: Decimal
    total_payable: Decimal
    recent_transactions: list[CashbookEntryOut]
