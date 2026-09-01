"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api-client";
import type { Page } from "@/lib/hooks/types";

export interface SalaryPayment {
  id: string;
  entry_date: string;
  employee_id: string;
  employee_name: string;
  period_month: string;
  amount: string;
  mode: string;
  created_by: string;
  created_at: string;
}

export interface AdvanceSalary {
  id: string;
  entry_date: string;
  employee_id: string;
  employee_name: string;
  amount: string;
  adjusted_status: string;
  created_by: string;
  created_at: string;
}

export interface EmployeeLedgerEntry {
  id: string;
  entry_date: string;
  type: "salary" | "advance_salary";
  amount: string;
  period_month: string | null;
  adjusted_status: string | null;
}

export interface EmployeeLedger {
  employee_id: string;
  employee_name: string;
  total_salary_paid: string;
  total_advances_given: string;
  total_advances_adjusted: string;
  advances_outstanding: string;
  entries: EmployeeLedgerEntry[];
}

interface ListParams {
  page: number;
  page_size: number;
}

export function useSalaryPayments(params: ListParams) {
  const query = new URLSearchParams({ page: String(params.page), page_size: String(params.page_size) });
  return useQuery({
    queryKey: ["salary-payments", params],
    queryFn: () => apiFetch<Page<SalaryPayment>>(`/employees/salary?${query.toString()}`),
  });
}

export function useAdvanceSalaries(params: ListParams) {
  const query = new URLSearchParams({ page: String(params.page), page_size: String(params.page_size) });
  return useQuery({
    queryKey: ["advance-salaries", params],
    queryFn: () => apiFetch<Page<AdvanceSalary>>(`/employees/advance?${query.toString()}`),
  });
}

export function useEmployeeLedger(employeeId: string | null) {
  return useQuery({
    queryKey: ["employee-ledger", employeeId],
    queryFn: () => apiFetch<EmployeeLedger>(`/employees/${employeeId}/ledger`),
    enabled: !!employeeId,
  });
}

export interface SalaryPaymentCreateInput {
  entry_date: string;
  employee_id: string;
  period_month: string;
  amount: number;
  mode: "cash" | "bank" | "upi";
}

export function useCreateSalaryPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SalaryPaymentCreateInput) =>
      apiFetch<SalaryPayment>("/employees/salary", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["salary-payments"] });
      void queryClient.invalidateQueries({ queryKey: ["cashbook"] });
      void queryClient.invalidateQueries({ queryKey: ["employee-ledger"] });
    },
  });
}

export interface AdvanceSalaryCreateInput {
  entry_date: string;
  employee_id: string;
  amount: number;
}

export function useCreateAdvanceSalary() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AdvanceSalaryCreateInput) =>
      apiFetch<AdvanceSalary>("/employees/advance", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["advance-salaries"] });
      void queryClient.invalidateQueries({ queryKey: ["cashbook"] });
      void queryClient.invalidateQueries({ queryKey: ["employee-ledger"] });
    },
  });
}

export function useUpdateAdvanceSalary() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, adjusted_status }: { id: string; adjusted_status: "pending" | "adjusted" }) =>
      apiFetch<AdvanceSalary>(`/employees/advance/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ adjusted_status }),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["advance-salaries"] });
      void queryClient.invalidateQueries({ queryKey: ["employee-ledger"] });
    },
  });
}
