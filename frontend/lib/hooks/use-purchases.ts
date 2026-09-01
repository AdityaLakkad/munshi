"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api-client";
import type { Page } from "@/lib/hooks/types";

export interface PurchaseEntry {
  id: string;
  entry_date: string;
  supplier_id: string;
  supplier_name: string;
  item_desc: string | null;
  qty: string;
  rate: string;
  total_amount: string;
  created_by: string;
  created_at: string;
}

export interface PurchasePayment {
  id: string;
  entry_date: string;
  supplier_id: string;
  supplier_name: string;
  purchase_entry_id: string | null;
  amount: string;
  mode: string;
  created_by: string;
  created_at: string;
}

export interface SupplierOutstanding {
  supplier_id: string;
  supplier_name: string;
  total_purchases: string;
  total_paid: string;
  outstanding: string;
}

interface ListParams {
  page: number;
  page_size: number;
}

export function usePurchaseEntries(params: ListParams) {
  const query = new URLSearchParams({ page: String(params.page), page_size: String(params.page_size) });
  return useQuery({
    queryKey: ["purchase-entries", params],
    queryFn: () => apiFetch<Page<PurchaseEntry>>(`/purchases/entries?${query.toString()}`),
  });
}

export function usePurchasePayments(params: ListParams) {
  const query = new URLSearchParams({ page: String(params.page), page_size: String(params.page_size) });
  return useQuery({
    queryKey: ["purchase-payments", params],
    queryFn: () => apiFetch<Page<PurchasePayment>>(`/purchases/payments?${query.toString()}`),
  });
}

export function useSupplierOutstanding(params: ListParams) {
  const query = new URLSearchParams({ page: String(params.page), page_size: String(params.page_size) });
  return useQuery({
    queryKey: ["purchases-outstanding", params],
    queryFn: () => apiFetch<Page<SupplierOutstanding>>(`/purchases/outstanding?${query.toString()}`),
  });
}

export interface PurchaseEntryCreateInput {
  entry_date: string;
  supplier_id: string;
  item_desc?: string;
  qty: number;
  rate: number;
}

export function useCreatePurchaseEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PurchaseEntryCreateInput) =>
      apiFetch<PurchaseEntry>("/purchases/entries", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["purchase-entries"] });
      void queryClient.invalidateQueries({ queryKey: ["purchases-outstanding"] });
    },
  });
}

export interface PurchasePaymentCreateInput {
  entry_date: string;
  supplier_id: string;
  amount: number;
  mode: "cash" | "bank" | "upi";
}

export function useCreatePurchasePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PurchasePaymentCreateInput) =>
      apiFetch<PurchasePayment>("/purchases/payments", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["purchase-payments"] });
      void queryClient.invalidateQueries({ queryKey: ["purchases-outstanding"] });
      void queryClient.invalidateQueries({ queryKey: ["cashbook"] });
    },
  });
}
