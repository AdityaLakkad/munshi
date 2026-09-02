"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowLeftRight, Download, Minus, Plus } from "lucide-react";

import { DataTable } from "@/components/data-table";
import { CashbookEntryForm } from "@/components/forms/cashbook-entry-form";
import { TransferForm } from "@/components/forms/transfer-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { downloadReportCsv } from "@/lib/api-client";
import { useCashbookLedger, type CashbookLedgerRow } from "@/lib/hooks/use-cashbook";
import { cn, formatMoney } from "@/lib/utils";

const TYPE_LABELS: Record<string, string> = {
  credit: "Credit",
  debit: "Debit",
  sales_payment: "Sales payment",
  purchase_payment: "Purchase payment",
  salary: "Salary",
  advance_salary: "Advance salary",
  transfer: "Transfer",
};

const columns: ColumnDef<CashbookLedgerRow>[] = [
  { accessorKey: "entry_date", header: "Date" },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => <Badge variant="secondary">{TYPE_LABELS[row.original.type] ?? row.original.type}</Badge>,
  },
  {
    id: "details",
    header: "Details",
    cell: ({ row }) => row.original.category ?? row.original.remarks ?? "—",
  },
  { accessorKey: "mode", header: "Mode", cell: ({ row }) => row.original.mode.toUpperCase() },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => {
      const value = Number(row.original.amount);
      return (
        <span className={cn("tabular-nums", value >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive")}>
          {value >= 0 ? "+" : ""}
          {formatMoney(row.original.amount)}
        </span>
      );
    },
  },
  {
    accessorKey: "running_balance",
    header: "Balance",
    cell: ({ row }) => <span className="tabular-nums font-medium">{formatMoney(row.original.running_balance)}</span>,
  },
];

export default function CashbookPage() {
  const [page, setPage] = React.useState(1);
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [type, setType] = React.useState<string>("all");
  const { toast } = useToast();

  const { data, isLoading } = useCashbookLedger({
    page,
    page_size: 20,
    from: from || undefined,
    to: to || undefined,
    type: type === "all" ? undefined : type,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold tracking-tight">CashBook</h1>
        <div className="flex flex-wrap gap-2" data-tour="cashbook-actions">
          <CashbookEntryForm
            type="credit"
            trigger={
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4" /> Credit
              </Button>
            }
          />
          <CashbookEntryForm
            type="debit"
            trigger={
              <Button size="sm" variant="outline">
                <Minus className="h-4 w-4" /> Debit
              </Button>
            }
          />
          <TransferForm
            trigger={
              <Button size="sm">
                <ArrowLeftRight className="h-4 w-4" /> Transfer
              </Button>
            }
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              downloadReportCsv("cashbook", {
                ...(from ? { from } : {}),
                ...(to ? { to } : {}),
              }).catch((err) =>
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
      </div>

      <div className="flex flex-wrap items-end gap-2" data-tour="cashbook-filters">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">From</label>
          <Input
            type="date"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setPage(1);
            }}
            className="w-40"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">To</label>
          <Input
            type="date"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              setPage(1);
            }}
            className="w-40"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Type</label>
          <Select
            value={type}
            onValueChange={(v) => {
              setType(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {Object.entries(TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div data-tour="cashbook-table">
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
    </div>
  );
}
