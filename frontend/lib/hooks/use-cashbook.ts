"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api-client";
import type { Page } from "@/lib/hooks/types";

export interface CashbookEntry {
  id: string;
  entry_date: string;
  type: string;
  amount: string;
  mode: string;
  category: string | null;
  linked_ref_type: string | null;
  linked_ref_id: string | null;
  remarks: string | null;
  created_by: string;
  created_at: string;
}

export interface CashbookLedgerRow extends CashbookEntry {
  running_balance: string;
}

interface CashbookListParams {
  page: number;
  page_size: number;
  from?: string;
  to?: string;
  type?: string;
  mode?: string;
}

export function useCashbookLedger(params: CashbookListParams) {
  const query = new URLSearchParams({
    page: String(params.page),
    page_size: String(params.page_size),
    ...(params.from ? { from: params.from } : {}),
    ...(params.to ? { to: params.to } : {}),
    ...(params.type ? { type: params.type } : {}),
    ...(params.mode ? { mode: params.mode } : {}),
  });
  return useQuery({
    queryKey: ["cashbook", params],
    queryFn: () => apiFetch<Page<CashbookLedgerRow>>(`/cashbook?${query.toString()}`),
  });
}

export interface CashbookEntryCreateInput {
  entry_date: string;
  type: "credit" | "debit";
  amount: number;
  mode: "cash" | "bank" | "upi";
  category?: string;
  remarks?: string;
}

export interface TransferCreateInput {
  entry_date: string;
  from_mode: "cash" | "bank" | "upi";
  to_mode: "cash" | "bank" | "upi";
  amount: number;
  remarks?: string;
}

export function useCreateCashbookEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CashbookEntryCreateInput) =>
      apiFetch<CashbookEntry>("/cashbook", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["cashbook"] });
    },
  });
}

export function useCreateTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: TransferCreateInput) =>
      apiFetch<CashbookEntry[]>("/cashbook/transfer", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["cashbook"] });
    },
  });
}
