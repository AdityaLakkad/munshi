"use client";

import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import type { AuthUser } from "@/lib/auth";

interface TopbarProps {
  user: AuthUser;
  onOpenPalette: () => void;
  onLogout: () => void;
}

export function Topbar({ user, onOpenPalette, onLogout }: TopbarProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b bg-card px-4">
      <button
        onClick={onOpenPalette}
        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        Press <kbd className="rounded border bg-secondary px-1.5 py-0.5 text-xs">⌘K</kbd> to search
      </button>
      <div className="flex items-center gap-3">
        <div className="hidden text-right text-xs leading-tight sm:block">
          <div className="font-medium">{user.name}</div>
          <div className="text-muted-foreground">{user.tenant_name}</div>
        </div>
        <ThemeToggle />
        <Button variant="ghost" size="icon" aria-label="Log out" onClick={onLogout}>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
