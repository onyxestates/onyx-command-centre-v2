"use client";

import { Bell, LogOut, Search } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useUnreadNotifications } from "@/hooks/use-onyx-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function Topbar() {
  const { workspace, profile, logout } = useAuth();
  const notifications = useUnreadNotifications();

  return (
    <div className="sticky top-0 z-30 flex flex-col gap-4 border-b border-white/6 bg-black/65 px-4 py-4 backdrop-blur xl:flex-row xl:items-center xl:justify-between">
      <div className="min-w-0">
        <div className="text-xs uppercase tracking-[0.24em] text-[var(--gold)]">Workspace</div>
        <div className="mt-1 truncate text-lg font-semibold">{workspace?.name ?? "Onyx Workspace"}</div>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center xl:max-w-3xl xl:flex-1">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
          <Input className="pl-10" placeholder="Search listings, guests, jobs, issues" />
        </div>
        <div className="flex items-center justify-between gap-3 sm:justify-end">
          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-300">
            <Bell className="size-4 text-[var(--gold)]" />
            <span>{notifications.data.length}</span>
          </div>
          <div className="hidden text-right md:block">
            <p className="text-sm font-medium">{profile?.displayName ?? "Team member"}</p>
            <p className="text-xs text-zinc-500">{profile?.email ?? "No email loaded"}</p>
          </div>
          <Button className="bg-white text-black hover:bg-zinc-100" onClick={() => logout()}>
            <LogOut className="mr-2 size-4" /> Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}
