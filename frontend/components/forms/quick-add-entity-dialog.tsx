"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api-client";

const quickAddSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
  address: z.string().optional(),
});

type QuickAddValues = z.infer<typeof quickAddSchema>;

interface CreatedEntity {
  id: string;
  name: string;
}

interface QuickAddEntityDialogProps {
  title: string;
  createEndpoint: string;
  onCreated: (entity: CreatedEntity) => void;
}

/** Inline "+ new customer/supplier" quick-add (SRS FR-3.4 / FR-4.4). */
export function QuickAddEntityDialog({ title, createEndpoint, onCreated }: QuickAddEntityDialogProps) {
  const [open, setOpen] = React.useState(false);
  const { toast } = useToast();
  const [submitting, setSubmitting] = React.useState(false);
  const form = useForm<QuickAddValues>({
    resolver: zodResolver(quickAddSchema),
    defaultValues: { name: "", phone: "", address: "" },
  });

  async function onSubmit(values: QuickAddValues) {
    setSubmitting(true);
    try {
      const created = await apiFetch<CreatedEntity>(createEndpoint, {
        method: "POST",
        body: JSON.stringify({
          name: values.name,
          phone: values.phone || undefined,
          address: values.address || undefined,
        }),
      });
      onCreated(created);
      form.reset();
      setOpen(false);
    } catch (err) {
      toast({
        variant: "destructive",
        title: `Could not add ${title.toLowerCase()}`,
        description: err instanceof Error ? err.message : "Something went wrong.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="icon" aria-label={`Add ${title.toLowerCase()}`}>
          <Plus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New {title.toLowerCase()}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} autoFocus />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
