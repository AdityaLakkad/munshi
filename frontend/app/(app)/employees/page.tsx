"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Download, Plus } from "lucide-react";

import { DataTable } from "@/components/data-table";
import { EmployeeLedgerDialog } from "@/components/employee-ledger-dialog";
import { AdvanceSalaryForm } from "@/components/forms/advance-salary-form";
import { EmployeeForm } from "@/components/forms/employee-form";
import { SalaryPaymentForm } from "@/components/forms/salary-payment-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { downloadReportCsv } from "@/lib/api-client";
import { useEmployees, type Employee } from "@/lib/hooks/use-employees";
import {
  useAdvanceSalaries,
  useSalaryPayments,
  useUpdateAdvanceSalary,
  type AdvanceSalary,
  type SalaryPayment,
} from "@/lib/hooks/use-salary";
import { formatMoney } from "@/lib/utils";

export default function EmployeesPage() {
  const [page, setPage] = React.useState(1);
  const [q, setQ] = React.useState("");
  const [ledgerEmployeeId, setLedgerEmployeeId] = React.useState<string | null>(null);
  const { data, isLoading } = useEmployees({ page, page_size: 20, q: q || undefined });

  const employeeColumns: ColumnDef<Employee>[] = [
    { accessorKey: "name", header: "Name" },
    { accessorKey: "designation", header: "Designation", cell: ({ row }) => row.original.designation ?? "—" },
    {
      accessorKey: "monthly_salary",
      header: "Monthly salary",
      cell: ({ row }) => <span className="tabular-nums">{formatMoney(row.original.monthly_salary)}</span>,
    },
    { accessorKey: "joining_date", header: "Joined", cell: ({ row }) => row.original.joining_date ?? "—" },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.status === "active" ? "default" : "secondary"}>{row.original.status}</Badge>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <Button variant="outline" size="sm" onClick={() => setLedgerEmployeeId(row.original.id)}>
          Ledger
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold tracking-tight">Employees</h1>
        <div className="flex flex-wrap gap-2">
          <EmployeeForm
            trigger={
              <Button size="sm">
                <Plus className="h-4 w-4" /> Add employee
              </Button>
            }
          />
          <SalaryPaymentForm
            trigger={
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4" /> Pay salary
              </Button>
            }
          />
          <AdvanceSalaryForm
            trigger={
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4" /> Give advance
              </Button>
            }
          />
        </div>
      </div>

      <Tabs defaultValue="employees">
        <TabsList>
          <TabsTrigger value="employees">Employees</TabsTrigger>
          <TabsTrigger value="salary">Salary</TabsTrigger>
          <TabsTrigger value="advance">Advance salary</TabsTrigger>
        </TabsList>

        <TabsContent value="employees" className="mt-4 space-y-4">
          <Input
            placeholder="Search employees..."
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            className="max-w-xs"
          />
          <DataTable
            columns={employeeColumns}
            data={data?.items ?? []}
            isLoading={isLoading}
            page={page}
            pageSize={20}
            total={data?.total ?? 0}
            onPageChange={setPage}
          />
        </TabsContent>

        <TabsContent value="salary" className="mt-4">
          <SalaryTab />
        </TabsContent>

        <TabsContent value="advance" className="mt-4">
          <AdvanceTab />
        </TabsContent>
      </Tabs>

      <EmployeeLedgerDialog
        employeeId={ledgerEmployeeId}
        onOpenChange={(open) => !open && setLedgerEmployeeId(null)}
      />
    </div>
  );
}

const salaryColumns: ColumnDef<SalaryPayment>[] = [
  { accessorKey: "entry_date", header: "Paid on" },
  { accessorKey: "employee_name", header: "Employee" },
  { accessorKey: "period_month", header: "For month" },
  { accessorKey: "mode", header: "Mode", cell: ({ row }) => row.original.mode.toUpperCase() },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => <span className="tabular-nums font-medium">{formatMoney(row.original.amount)}</span>,
  },
];

function SalaryTab() {
  const [page, setPage] = React.useState(1);
  const { toast } = useToast();
  const { data, isLoading } = useSalaryPayments({ page, page_size: 20 });
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            downloadReportCsv("salary").catch((err) =>
              toast({
                variant: "destructive",
                title: "Export failed",
                description: err instanceof Error ? err.message : "Something went wrong.",
              })
            )
          }
        >
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>
      <DataTable
        columns={salaryColumns}
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

function AdvanceTab() {
  const [page, setPage] = React.useState(1);
  const { data, isLoading } = useAdvanceSalaries({ page, page_size: 20 });
  const updateAdvance = useUpdateAdvanceSalary();

  const columns: ColumnDef<AdvanceSalary>[] = [
    { accessorKey: "entry_date", header: "Date" },
    { accessorKey: "employee_name", header: "Employee" },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => <span className="tabular-nums font-medium">{formatMoney(row.original.amount)}</span>,
    },
    {
      accessorKey: "adjusted_status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.adjusted_status === "adjusted" ? "secondary" : "default"}>
          {row.original.adjusted_status}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) =>
        row.original.adjusted_status === "pending" ? (
          <Button
            variant="outline"
            size="sm"
            disabled={updateAdvance.isPending}
            onClick={() => updateAdvance.mutate({ id: row.original.id, adjusted_status: "adjusted" })}
          >
            Mark adjusted
          </Button>
        ) : null,
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={data?.items ?? []}
      isLoading={isLoading}
      page={page}
      pageSize={20}
      total={data?.total ?? 0}
      onPageChange={setPage}
    />
  );
}
