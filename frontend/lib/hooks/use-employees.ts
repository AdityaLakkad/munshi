"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api-client";
import type { Page } from "@/lib/hooks/types";

export interface Employee {
  id: string;
  name: string;
  designation: string | null;
  monthly_salary: string;
  joining_date: string | null;
  status: string;
  created_at: string;
}

interface EmployeeListParams {
  page: number;
  page_size: number;
  q?: string;
}

export function useEmployees(params: EmployeeListParams) {
  const query = new URLSearchParams({
    page: String(params.page),
    page_size: String(params.page_size),
    ...(params.q ? { q: params.q } : {}),
  });
  return useQuery({
    queryKey: ["employees", params],
    queryFn: () => apiFetch<Page<Employee>>(`/employees?${query.toString()}`),
  });
}

export interface EmployeeCreateInput {
  name: string;
  designation?: string;
  monthly_salary: number;
  joining_date?: string;
  status?: string;
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: EmployeeCreateInput) =>
      apiFetch<Employee>("/employees", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });
}
