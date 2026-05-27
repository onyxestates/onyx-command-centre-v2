"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, BookOpen, Building2, CalendarDays, LayoutDashboard, MessagesSquare, Package2, Settings, Sparkles, Users, Wrench } from "lucide-react";
import { NAV_ITEMS } from "@/config/navigation";
import { hasPermission } from "@/lib/utils/permissions";
import { cn } from "@/lib/utils/cn";
import type { WorkspaceMember } from "@/types/app";

const iconMap = { "layout-dashboard": LayoutDashboard, "building-2": Building2, "book-open": BookOpen, users: Users, "messages-square": MessagesSquare, sparkles: Sparkles, wrench: Wrench, "calendar-days": CalendarDays, "bar-chart-3": BarChart3, "package-2": Package2, settings: Settings } as const;

export function Sidebar({ member }: { member: WorkspaceMember | null }) {
  const pathname = usePathname();
  return (
    <aside className="hidden w-72 shrink-0 border-r border-white/6 bg-black/30 px-5 py-6 lg:block">
      <div className="mb-8 px-3">
        <div className="text-xs uppercase tracking-[0.28em] text-[var(--gold)]">Onyx</div>
        <div className="mt-2 text-2xl font-semibold">Command Centre</div>
      </div>
      <nav className="space-y-2">
        {NAV_ITEMS.filter((item) => hasPermission(member, item.permission)).map((item) => {
          const Icon = iconMap[item.icon as keyof typeof iconMap];
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className={cn("flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition", active ? "bg-[var(--gold-soft)] text-[var(--gold)]" : "text-zinc-300 hover:bg-white/5 hover:text-white")}>
              <Icon className="size-4" />
              {item.title}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
