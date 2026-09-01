"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Download, Plus } from "lucide-react";

import { DataTable } from "@/components/data-table";
import { PurchaseEntryForm } from "@/components/forms/purchase-entry-form";
import { PurchasePaymentForm } from "@/components/forms/purchase-payment-form";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { downloadReportCsv } from "@/lib/api-client";
import {
  usePurchaseEntries,
  usePurchasePayments,
  useSupplierOutstanding,
  type PurchaseEntry,
  type PurchasePayment,
  type SupplierOutstanding,
} from "@/lib/hooks/use-purchases";
import { formatMoney } from "@/lib/utils";

const entryColumns: ColumnDef<PurchaseEntry>[] = [
  { accessorKey: "entry_date", header: "Date" },
  { accessorKey: "supplier_name", header: "Supplier" },
  { accessorKey: "item_desc", header: "Item", cell: ({ row }) => row.original.item_desc ?? "—" },
  { accessorKey: "qty", header: "Qty" },
  { accessorKey: "rate", header: "Rate", cell: ({ row }) => formatMoney(row.original.rate) },
  {
    accessorKey: "total_amount",
    header: "Total",
    cell: ({ row }) => <span className="tabular-nums font-medium">{formatMoney(row.original.total_amount)}</span>,
  },
];

const paymentColumns: ColumnDef<PurchasePayment>[] = [
  { accessorKey: "entry_date", header: "Date" },
  { accessorKey: "supplier_name", header: "Supplier" },
  { accessorKey: "mode", header: "Mode", cell: ({ row }) => row.original.mode.toUpperCase() },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => <span className="tabular-nums font-medium">{formatMoney(row.original.amount)}</span>,
  },
];

const outstandingColumns: ColumnDef<SupplierOutstanding>[] = [
  { accessorKey: "supplier_name", header: "Supplier" },
  { accessorKey: "total_purchases", header: "Total purchases", cell: ({ row }) => formatMoney(row.original.total_purchases) },
  { accessorKey: "total_paid", header: "Total paid", cell: ({ row }) => formatMoney(row.original.total_paid) },
  {
    accessorKey: "outstanding",
    header: "Outstanding",
    cell: ({ row }) => (
      <span className="tabular-nums font-medium text-destructive">{formatMoney(row.original.outstanding)}</span>
    ),
  },
];

export default function PurchasesPage() {
  const [entriesPage, setEntriesPage] = React.useState(1);
  const [paymentsPage, setPaymentsPage] = React.useState(1);
  const [outstandingPage, setOutstandingPage] = React.useState(1);
  const { toast } = useToast();

  const entries = usePurchaseEntries({ page: entriesPage, page_size: 20 });
  const payments = usePurchasePayments({ page: paymentsPage, page_size: 20 });
  const outstanding = useSupplierOutstanding({ page: outstandingPage, page_size: 20 });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold tracking-tight">Purchases</h1>
        <div className="flex flex-wrap gap-2">
          <PurchaseEntryForm
            trigger={
              <Button size="sm">
                <Plus className="h-4 w-4" /> New purchase
              </Button>
            }
          />
          <PurchasePaymentForm
            trigger={
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4" /> Record payment
              </Button>
            }
          />
        </div>
      </div>

      <Tabs defaultValue="entries">
        <TabsList>
          <TabsTrigger value="entries">Entries</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="outstanding">Outstanding</TabsTrigger>
        </TabsList>
        <TabsContent value="entries" className="mt-4">
          <DataTable
            columns={entryColumns}
            data={entries.data?.items ?? []}
            isLoading={entries.isLoading}
            page={entriesPage}
            pageSize={20}
            total={entries.data?.total ?? 0}
            onPageChange={setEntriesPage}
          />
        </TabsContent>
        <TabsContent value="payments" className="mt-4">
          <DataTable
            columns={paymentColumns}
            data={payments.data?.items ?? []}
            isLoading={payments.isLoading}
            page={paymentsPage}
            pageSize={20}
            total={payments.data?.total ?? 0}
            onPageChange={setPaymentsPage}
          />
        </TabsContent>
        <TabsContent value="outstanding" className="mt-4 space-y-3">
          <div className="flex justify-end">
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                downloadReportCsv("purchases-outstanding").catch((err) =>
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
            columns={outstandingColumns}
            data={outstanding.data?.items ?? []}
            isLoading={outstanding.isLoading}
            page={outstandingPage}
            pageSize={20}
            total={outstanding.data?.total ?? 0}
            onPageChange={setOutstandingPage}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
