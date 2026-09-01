"use client";

import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useEmployeeLedger } from "@/lib/hooks/use-salary";
import { formatMoney } from "@/lib/utils";

interface EmployeeLedgerDialogProps {
  employeeId: string | null;
  onOpenChange: (open: boolean) => void;
}

export function EmployeeLedgerDialog({ employeeId, onOpenChange }: EmployeeLedgerDialogProps) {
  const { data, isLoading } = useEmployeeLedger(employeeId);

  return (
    <Dialog open={!!employeeId} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{data ? `${data.employee_name} — Ledger` : "Employee ledger"}</DialogTitle>
        </DialogHeader>
        {isLoading || !data ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Salary paid</div>
                <div className="font-medium tabular-nums">{formatMoney(data.total_salary_paid)}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Advances given</div>
                <div className="font-medium tabular-nums">{formatMoney(data.total_advances_given)}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Advances outstanding</div>
                <div className="font-medium tabular-nums text-destructive">
                  {formatMoney(data.advances_outstanding)}
                </div>
              </div>
            </div>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.entries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-20 text-center text-muted-foreground">
                        No entries yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.entries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>{entry.entry_date}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{entry.type === "salary" ? "Salary" : "Advance"}</Badge>
                        </TableCell>
                        <TableCell>
                          {entry.type === "salary" ? `For ${entry.period_month}` : entry.adjusted_status}
                        </TableCell>
                        <TableCell className="tabular-nums font-medium">{formatMoney(entry.amount)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
