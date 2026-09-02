"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus } from "lucide-react";

import { DataTable } from "@/components/data-table";
import { TeamMemberForm } from "@/components/forms/team-member-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import {
  useDeleteTeamMember,
  useTeamMembers,
  useUpdateTeamMember,
  type TeamMember,
} from "@/lib/hooks/use-settings";

const ROLE_LABEL: Record<TeamMember["role"], string> = {
  firm_admin: "Firm Admin",
  staff: "Staff",
  viewer: "Viewer",
};

export function TeamTable() {
  const [page, setPage] = React.useState(1);
  const { user } = useAuth();
  const { toast } = useToast();
  const { data, isLoading } = useTeamMembers({ page, page_size: 20 });
  const updateMember = useUpdateTeamMember();
  const deleteMember = useDeleteTeamMember();

  function handleRoleChange(member: TeamMember, role: TeamMember["role"]) {
    updateMember.mutate(
      { id: member.id, role },
      {
        onSuccess: () => toast({ title: "Role updated", description: `${member.name} is now ${ROLE_LABEL[role]}.` }),
        onError: (err) =>
          toast({
            variant: "destructive",
            title: "Could not update role",
            description: err instanceof Error ? err.message : "Something went wrong.",
          }),
      }
    );
  }

  function handleRemove(member: TeamMember) {
    if (!window.confirm(`Remove ${member.name}'s account? They will no longer be able to sign in.`)) return;
    deleteMember.mutate(member.id, {
      onSuccess: () => toast({ title: "Account removed", description: `${member.name} was removed.` }),
      onError: (err) =>
        toast({
          variant: "destructive",
          title: "Could not remove account",
          description: err instanceof Error ? err.message : "Something went wrong.",
        }),
    });
  }

  const columns: ColumnDef<TeamMember>[] = [
    { accessorKey: "name", header: "Name" },
    { accessorKey: "email", header: "Email" },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => {
        const member = row.original;
        const isSelf = member.id === user?.id;
        return (
          <Select
            value={member.role}
            disabled={isSelf || updateMember.isPending}
            onValueChange={(value) => handleRoleChange(member, value as TeamMember["role"])}
          >
            <SelectTrigger className="h-8 w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="firm_admin">Firm Admin</SelectItem>
              <SelectItem value="staff">Staff</SelectItem>
              <SelectItem value="viewer">Viewer</SelectItem>
            </SelectContent>
          </Select>
        );
      },
    },
    {
      id: "you",
      header: "",
      cell: ({ row }) => (row.original.id === user?.id ? <Badge variant="secondary">You</Badge> : null),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const isSelf = row.original.id === user?.id;
        return (
          <Button
            variant="outline"
            size="sm"
            disabled={isSelf || deleteMember.isPending}
            onClick={() => handleRemove(row.original)}
          >
            Remove
          </Button>
        );
      },
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <TeamMemberForm
          trigger={
            <Button size="sm">
              <Plus className="h-4 w-4" /> Add team member
            </Button>
          }
        />
      </div>
      <DataTable
        columns={columns}
        data={data?.items ?? []}
        isLoading={isLoading}
        page={page}
        pageSize={20}
        total={data?.total ?? 0}
        onPageChange={setPage}
      />
    </div>
  );
}
