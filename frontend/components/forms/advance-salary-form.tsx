"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { EntityCombobox } from "@/components/entity-combobox";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useCreateAdvanceSalary } from "@/lib/hooks/use-salary";

const advanceSchema = z.object({
  entry_date: z.string().min(1, "Date is required"),
  employee_id: z.string().min(1, "Employee is required"),
  amount: z.coerce.number().positive("Must be greater than 0"),
});

type AdvanceFormValues = z.infer<typeof advanceSchema>;

export function AdvanceSalaryForm({ trigger }: { trigger: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const [employeeLabel, setEmployeeLabel] = React.useState<{ id: string; name: string } | null>(null);
  const { toast } = useToast();
  const createAdvance = useCreateAdvanceSalary();
  const form = useForm<AdvanceFormValues>({
    resolver: zodResolver(advanceSchema),
    defaultValues: { entry_date: new Date().toISOString().slice(0, 10), employee_id: "", amount: 0 },
  });

  async function onSubmit(values: AdvanceFormValues) {
    try {
      await createAdvance.mutateAsync(values);
      toast({ title: "Advance recorded", description: "The cashbook was updated." });
      form.reset({ entry_date: values.entry_date, employee_id: "", amount: 0 });
      setEmployeeLabel(null);
      setOpen(false);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Could not save advance",
        description: err instanceof Error ? err.message : "Something went wrong.",
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New advance salary</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="employee_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Employee</FormLabel>
                  <FormControl>
                    <EntityCombobox
                      searchEndpoint="/search/employees"
                      value={field.value || null}
                      selectedOption={employeeLabel}
                      onChange={(id, entity) => {
                        field.onChange(id ?? "");
                        setEmployeeLabel(entity);
                      }}
                      placeholder="Select employee..."
                    />
                  </FormControl>
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
            <DialogFooter>
              <Button type="submit" disabled={createAdvance.isPending}>
                {createAdvance.isPending ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
