"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { CommandPalette, useCommandPaletteShortcut } from "@/components/layout/command-palette";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { HelpMeButton } from "@/components/help/help-me-button";
import { useAuth } from "@/lib/auth";

/** Protected app shell: redirects to /login when there is no authenticated user. */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const [paletteOpen, setPaletteOpen] = React.useState(false);
  useCommandPaletteShortcut(setPaletteOpen);

  React.useEffect(() => {
    if (!isLoading && !user) router.replace("/login");
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col pb-14 md:pb-0">
        <Topbar user={user} onOpenPalette={() => setPaletteOpen(true)} onLogout={logout} />
        <main className="flex-1 p-4">{children}</main>
      </div>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      <HelpMeButton />
    </div>
  );
}
