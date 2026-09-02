"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Download, Plus } from "lucide-react";

import { DataTable } from "@/components/data-table";
import { SalesEntryForm } from "@/components/forms/sales-entry-form";
import { SalesPaymentForm } from "@/components/forms/sales-payment-form";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { downloadReportCsv } from "@/lib/api-client";
import {
  useCustomerOutstanding,
  useSalesEntries,
  useSalesPayments,
  type CustomerOutstanding,
  type SalesEntry,
  type SalesPayment,
} from "@/lib/hooks/use-sales";
import { formatMoney } from "@/lib/utils";

const entryColumns: ColumnDef<SalesEntry>[] = [
  { accessorKey: "entry_date", header: "Date" },
  { accessorKey: "customer_name", header: "Customer" },
  { accessorKey: "item_desc", header: "Item", cell: ({ row }) => row.original.item_desc ?? "—" },
  { accessorKey: "qty", header: "Qty" },
  { accessorKey: "rate", header: "Rate", cell: ({ row }) => formatMoney(row.original.rate) },
  {
    accessorKey: "total_amount",
    header: "Total",
    cell: ({ row }) => <span className="tabular-nums font-medium">{formatMoney(row.original.total_amount)}</span>,
  },
];

const paymentColumns: ColumnDef<SalesPayment>[] = [
  { accessorKey: "entry_date", header: "Date" },
  { accessorKey: "customer_name", header: "Customer" },
  { accessorKey: "mode", header: "Mode", cell: ({ row }) => row.original.mode.toUpperCase() },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => <span className="tabular-nums font-medium">{formatMoney(row.original.amount)}</span>,
  },
];

const outstandingColumns: ColumnDef<CustomerOutstanding>[] = [
  { accessorKey: "customer_name", header: "Customer" },
  { accessorKey: "total_sales", header: "Total sales", cell: ({ row }) => formatMoney(row.original.total_sales) },
  { accessorKey: "total_paid", header: "Total paid", cell: ({ row }) => formatMoney(row.original.total_paid) },
  {
    accessorKey: "outstanding",
    header: "Outstanding",
    cell: ({ row }) => (
      <span className="tabular-nums font-medium text-destructive">{formatMoney(row.original.outstanding)}</span>
    ),
  },
];

export default function SalesPage() {
  const [entriesPage, setEntriesPage] = React.useState(1);
  const [paymentsPage, setPaymentsPage] = React.useState(1);
  const [outstandingPage, setOutstandingPage] = React.useState(1);
  const { toast } = useToast();

  const entries = useSalesEntries({ page: entriesPage, page_size: 20 });
  const payments = useSalesPayments({ page: paymentsPage, page_size: 20 });
  const outstanding = useCustomerOutstanding({ page: outstandingPage, page_size: 20 });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold tracking-tight">Sales</h1>
        <div className="flex flex-wrap gap-2" data-tour="sales-actions">
          <SalesEntryForm
            trigger={
              <Button size="sm">
                <Plus className="h-4 w-4" /> New sale
              </Button>
            }
          />
          <SalesPaymentForm
            trigger={
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4" /> Record payment
              </Button>
            }
          />
        </div>
      </div>

      <Tabs defaultValue="entries">
        <TabsList data-tour="sales-tabs">
          <TabsTrigger value="entries">Entries</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="outstanding">Outstanding</TabsTrigger>
        </TabsList>
        <TabsContent value="entries" className="mt-4" data-tour="sales-table">
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
                downloadReportCsv("sales-outstanding").catch((err) =>
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
