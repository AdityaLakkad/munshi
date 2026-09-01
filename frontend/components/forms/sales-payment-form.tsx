"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { EntityCombobox } from "@/components/entity-combobox";
import { QuickAddEntityDialog } from "@/components/forms/quick-add-entity-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useCreateSalesPayment } from "@/lib/hooks/use-sales";

const paymentSchema = z.object({
  entry_date: z.string().min(1, "Date is required"),
  customer_id: z.string().min(1, "Customer is required"),
  amount: z.coerce.number().positive("Must be greater than 0"),
  mode: z.enum(["cash", "bank", "upi"]),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

export function SalesPaymentForm({ trigger }: { trigger: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const [customerLabel, setCustomerLabel] = React.useState<{ id: string; name: string } | null>(null);
  const { toast } = useToast();
  const createPayment = useCreateSalesPayment();
  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      entry_date: new Date().toISOString().slice(0, 10),
      customer_id: "",
      amount: 0,
      mode: "cash",
    },
  });

  async function onSubmit(values: PaymentFormValues) {
    try {
      await createPayment.mutateAsync(values);
      toast({ title: "Payment recorded", description: "The cashbook was updated." });
      form.reset({ entry_date: values.entry_date, customer_id: "", amount: 0, mode: "cash" });
      setCustomerLabel(null);
      setOpen(false);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Could not save payment",
        description: err instanceof Error ? err.message : "Something went wrong.",
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New sales payment</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="customer_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <EntityCombobox
                        searchEndpoint="/search/customers"
                        value={field.value || null}
                        selectedOption={customerLabel}
                        onChange={(id, entity) => {
                          field.onChange(id ?? "");
                          setCustomerLabel(entity);
                        }}
                        placeholder="Select customer..."
                      />
                    </FormControl>
                    <QuickAddEntityDialog
                      title="Customer"
                      createEndpoint="/customers"
                      onCreated={(entity) => {
                        field.onChange(entity.id);
                        setCustomerLabel(entity);
                      }}
                    />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="entry_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="mode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mode</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="bank">Bank</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={createPayment.isPending}>
                {createPayment.isPending ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
