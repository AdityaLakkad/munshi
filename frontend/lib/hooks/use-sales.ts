"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api-client";
import type { Page } from "@/lib/hooks/types";

export interface SalesEntry {
  id: string;
  entry_date: string;
  customer_id: string;
  customer_name: string;
  item_desc: string | null;
  qty: string;
  rate: string;
  total_amount: string;
  created_by: string;
  created_at: string;
}

export interface SalesPayment {
  id: string;
  entry_date: string;
  customer_id: string;
  customer_name: string;
  sales_entry_id: string | null;
  amount: string;
  mode: string;
  created_by: string;
  created_at: string;
}

export interface CustomerOutstanding {
  customer_id: string;
  customer_name: string;
  total_sales: string;
  total_paid: string;
  outstanding: string;
}

interface ListParams {
  page: number;
  page_size: number;
}

export function useSalesEntries(params: ListParams) {
  const query = new URLSearchParams({ page: String(params.page), page_size: String(params.page_size) });
  return useQuery({
    queryKey: ["sales-entries", params],
    queryFn: () => apiFetch<Page<SalesEntry>>(`/sales/entries?${query.toString()}`),
  });
}

export function useSalesPayments(params: ListParams) {
  const query = new URLSearchParams({ page: String(params.page), page_size: String(params.page_size) });
  return useQuery({
    queryKey: ["sales-payments", params],
    queryFn: () => apiFetch<Page<SalesPayment>>(`/sales/payments?${query.toString()}`),
  });
}

export function useCustomerOutstanding(params: ListParams) {
  const query = new URLSearchParams({ page: String(params.page), page_size: String(params.page_size) });
  return useQuery({
    queryKey: ["sales-outstanding", params],
    queryFn: () => apiFetch<Page<CustomerOutstanding>>(`/sales/outstanding?${query.toString()}`),
  });
}

export interface SalesEntryCreateInput {
  entry_date: string;
  customer_id: string;
  item_desc?: string;
  qty: number;
  rate: number;
}

export function useCreateSalesEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SalesEntryCreateInput) =>
      apiFetch<SalesEntry>("/sales/entries", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["sales-entries"] });
      void queryClient.invalidateQueries({ queryKey: ["sales-outstanding"] });
    },
  });
}

export interface SalesPaymentCreateInput {
  entry_date: string;
  customer_id: string;
  amount: number;
  mode: "cash" | "bank" | "upi";
}

export function useCreateSalesPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SalesPaymentCreateInput) =>
      apiFetch<SalesPayment>("/sales/payments", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["sales-payments"] });
      void queryClient.invalidateQueries({ queryKey: ["sales-outstanding"] });
      void queryClient.invalidateQueries({ queryKey: ["cashbook"] });
    },
  });
}
