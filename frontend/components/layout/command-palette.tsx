"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  LayoutDashboard,
  Plus,
  ShoppingCart,
  Settings,
  Truck,
  Users,
} from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * ⌘K / Ctrl+K command palette skeleton (SPECIFICATION.md §7). Quick-add
 * items route to their module page for now; swap for opening the real
 * create-forms once each module (Sales, Purchases, CashBook) is built.
 */
export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();

  const go = React.useCallback(
    (href: string) => {
      onOpenChange(false);
      router.push(href);
    },
    [onOpenChange, router]
  );

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Quick add">
          <CommandItem onSelect={() => go("/cashbook")}>
            <Plus /> New Credit
          </CommandItem>
          <CommandItem onSelect={() => go("/cashbook")}>
            <Plus /> New Debit
          </CommandItem>
          <CommandItem onSelect={() => go("/sales")}>
            <Plus /> New Sale
          </CommandItem>
          <CommandItem onSelect={() => go("/purchases")}>
            <Plus /> New Purchase
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Go to">
          <CommandItem onSelect={() => go("/dashboard")}>
            <LayoutDashboard /> Dashboard
          </CommandItem>
          <CommandItem onSelect={() => go("/cashbook")}>
            <BookOpen /> CashBook
          </CommandItem>
          <CommandItem onSelect={() => go("/sales")}>
            <ShoppingCart /> Sales
          </CommandItem>
          <CommandItem onSelect={() => go("/purchases")}>
            <Truck /> Purchases
          </CommandItem>
          <CommandItem onSelect={() => go("/employees")}>
            <Users /> Employees
          </CommandItem>
          <CommandItem onSelect={() => go("/settings")}>
            <Settings /> Settings
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

/** Registers the ⌘K / Ctrl+K global shortcut to toggle the command palette. */
export function useCommandPaletteShortcut(setOpen: (updater: (open: boolean) => boolean) => void) {
  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [setOpen]);
}
