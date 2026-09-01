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
import { useToast } from "@/hooks/use-toast";
import { useCreatePurchaseEntry } from "@/lib/hooks/use-purchases";
import { formatMoney } from "@/lib/utils";

const purchaseEntrySchema = z.object({
  entry_date: z.string().min(1, "Date is required"),
  supplier_id: z.string().min(1, "Supplier is required"),
  item_desc: z.string().optional(),
  qty: z.coerce.number().positive("Must be greater than 0"),
  rate: z.coerce.number().positive("Must be greater than 0"),
});

type PurchaseEntryFormValues = z.infer<typeof purchaseEntrySchema>;

export function PurchaseEntryForm({ trigger }: { trigger: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const [supplierLabel, setSupplierLabel] = React.useState<{ id: string; name: string } | null>(null);
  const { toast } = useToast();
  const createEntry = useCreatePurchaseEntry();
  const form = useForm<PurchaseEntryFormValues>({
    resolver: zodResolver(purchaseEntrySchema),
    defaultValues: {
      entry_date: new Date().toISOString().slice(0, 10),
      supplier_id: "",
      item_desc: "",
      qty: 1,
      rate: 0,
    },
  });

  const qty = form.watch("qty");
  const rate = form.watch("rate");
  const total = (Number(qty) || 0) * (Number(rate) || 0);

  async function onSubmit(values: PurchaseEntryFormValues) {
    try {
      await createEntry.mutateAsync({ ...values, item_desc: values.item_desc || undefined });
      toast({ title: "Purchase recorded", description: `Total ${formatMoney(total)}` });
      form.reset({ entry_date: values.entry_date, supplier_id: "", item_desc: "", qty: 1, rate: 0 });
      setSupplierLabel(null);
      setOpen(false);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Could not save purchase",
        description: err instanceof Error ? err.message : "Something went wrong.",
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New purchase</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="supplier_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Supplier</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <EntityCombobox
                        searchEndpoint="/search/suppliers"
                        value={field.value || null}
                        selectedOption={supplierLabel}
                        onChange={(id, entity) => {
                          field.onChange(id ?? "");
                          setSupplierLabel(entity);
                        }}
                        placeholder="Select supplier..."
                      />
                    </FormControl>
                    <QuickAddEntityDialog
                      title="Supplier"
                      createEndpoint="/suppliers"
                      onCreated={(entity) => {
                        field.onChange(entity.id);
                        setSupplierLabel(entity);
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
                name="item_desc"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g. Raw material" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="qty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rate</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Total: <span className="font-medium tabular-nums text-foreground">{formatMoney(total)}</span>
            </p>
            <DialogFooter>
              <Button type="submit" disabled={createEntry.isPending}>
                {createEntry.isPending ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
