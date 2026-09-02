"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api-client";
import type { Page } from "@/lib/hooks/types";

export interface TenantProfile {
  id: string;
  name: string;
  currency: string;
}

export function useTenantProfile() {
  return useQuery({
    queryKey: ["tenant-profile"],
    queryFn: () => apiFetch<TenantProfile>("/tenants/me"),
  });
}

export interface TenantProfileUpdateInput {
  name?: string;
  currency?: string;
}

export function useUpdateTenantProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: TenantProfileUpdateInput) =>
      apiFetch<TenantProfile>("/tenants/me", { method: "PATCH", body: JSON.stringify(input) }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tenant-profile"] });
    },
  });
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "firm_admin" | "staff" | "viewer";
  created_at: string;
}

export function useTeamMembers(params: { page: number; page_size: number }) {
  const query = new URLSearchParams({ page: String(params.page), page_size: String(params.page_size) });
  return useQuery({
    queryKey: ["team-members", params],
    queryFn: () => apiFetch<Page<TeamMember>>(`/users?${query.toString()}`),
  });
}

export interface TeamMemberCreateInput {
  name: string;
  email: string;
  password: string;
  role: "staff" | "viewer";
}

export function useCreateTeamMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: TeamMemberCreateInput) =>
      apiFetch<TeamMember>("/users", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["team-members"] });
    },
  });
}

export interface TeamMemberUpdateInput {
  id: string;
  role?: "firm_admin" | "staff" | "viewer";
  name?: string;
}

export function useUpdateTeamMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: TeamMemberUpdateInput) =>
      apiFetch<TeamMember>(`/users/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["team-members"] });
    },
  });
}

export function useDeleteTeamMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<void>(`/users/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["team-members"] });
    },
  });
}

export interface PasswordChangeInput {
  current_password: string;
  new_password: string;
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (input: PasswordChangeInput) =>
      apiFetch<void>("/users/me/password", { method: "PATCH", body: JSON.stringify(input) }),
  });
}
