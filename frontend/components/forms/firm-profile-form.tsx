"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { useTenantProfile, useUpdateTenantProfile } from "@/lib/hooks/use-settings";

const firmProfileSchema = z.object({
  name: z.string().min(1, "Firm name is required"),
  currency: z.string().length(3, "Use a 3-letter code, e.g. INR").toUpperCase(),
});

type FirmProfileFormValues = z.infer<typeof firmProfileSchema>;

export function FirmProfileForm() {
  const { toast } = useToast();
  const { refreshUser } = useAuth();
  const { data, isLoading } = useTenantProfile();
  const updateProfile = useUpdateTenantProfile();
  const form = useForm<FirmProfileFormValues>({
    resolver: zodResolver(firmProfileSchema),
    defaultValues: { name: "", currency: "" },
    values: data ? { name: data.name, currency: data.currency } : undefined,
  });

  async function onSubmit(values: FirmProfileFormValues) {
    try {
      await updateProfile.mutateAsync(values);
      await refreshUser();
      toast({ title: "Firm profile updated" });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Could not update firm profile",
        description: err instanceof Error ? err.message : "Something went wrong.",
      });
    }
  }

  if (isLoading || !data) return null;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-sm space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Firm name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="currency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Currency code</FormLabel>
              <FormControl>
                <Input {...field} maxLength={3} className="max-w-24 uppercase" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" size="sm" disabled={updateProfile.isPending}>
          {updateProfile.isPending ? "Saving..." : "Save changes"}
        </Button>
      </form>
    </Form>
  );
}
