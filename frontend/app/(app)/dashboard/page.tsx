"use client";

import { Minus, Plus } from "lucide-react";

import { CashbookEntryForm } from "@/components/forms/cashbook-entry-form";
import { PurchaseEntryForm } from "@/components/forms/purchase-entry-form";
import { SalesEntryForm } from "@/components/forms/sales-entry-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDashboard } from "@/lib/hooks/use-dashboard";
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

export default function DashboardPage() {
  const { data, isLoading } = useDashboard();

  const cards = [
    { title: "Cash in hand", value: data?.cash_in_hand },
    { title: "Bank balance", value: data?.bank_balance },
    { title: "Sales this month", value: data?.total_sales_this_month },
    { title: "Purchases this month", value: data?.total_purchases_this_month },
    { title: "Receivable", value: data?.total_receivable },
    { title: "Payable", value: data?.total_payable },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
        <div className="flex flex-wrap gap-2">
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
          <SalesEntryForm
            trigger={
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4" /> Sale
              </Button>
            }
          />
          <PurchaseEntryForm
            trigger={
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4" /> Purchase
              </Button>
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {cards.map((c) => (
          <Card key={c.title}>
            <CardHeader className="pb-2">
              <CardDescription>{c.title}</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading || c.value === undefined ? (
                <Skeleton className="h-6 w-20" />
              ) : (
                <p className="text-lg font-semibold tabular-nums">{formatMoney(c.value)}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((__, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full max-w-[140px]" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : !data || data.recent_transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-20 text-center text-muted-foreground">
                    No transactions yet.
                  </TableCell>
                </TableRow>
              ) : (
                data.recent_transactions.map((tx) => {
                  const value = Number(tx.amount);
                  return (
                    <TableRow key={tx.id}>
                      <TableCell>{tx.entry_date}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{TYPE_LABELS[tx.type] ?? tx.type}</Badge>
                      </TableCell>
                      <TableCell>{tx.mode.toUpperCase()}</TableCell>
                      <TableCell>{tx.category ?? tx.remarks ?? "—"}</TableCell>
                      <TableCell
                        className={cn(
                          "tabular-nums font-medium",
                          value >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"
                        )}
                      >
                        {value >= 0 ? "+" : ""}
                        {formatMoney(tx.amount)}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
