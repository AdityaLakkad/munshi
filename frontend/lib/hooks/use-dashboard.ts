"use client";

import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api-client";
import type { CashbookEntry } from "@/lib/hooks/use-cashbook";

export interface DashboardSummary {
  cash_in_hand: string;
  bank_balance: string;
  total_sales_this_month: string;
  total_purchases_this_month: string;
  total_receivable: string;
  total_payable: string;
  recent_transactions: CashbookEntry[];
}

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: () => apiFetch<DashboardSummary>("/dashboard"),
  });
}
