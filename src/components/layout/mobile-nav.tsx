"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/config/navigation";
import { hasPermission } from "@/lib/utils/permissions";
import type { WorkspaceMember } from "@/types/app";

export function MobileNav({ member }: { member: WorkspaceMember | null }) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => hasPermission(member, item.permission)).slice(0, 5);
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/8 bg-black/90 px-3 py-2 backdrop-blur lg:hidden">
      <div className="grid grid-cols-5 gap-2">
        {items.map((item) => (
          <Link key={item.href} href={item.href} className={`rounded-xl px-2 py-2 text-center text-[11px] ${pathname === item.href ? "bg-[var(--gold-soft)] text-[var(--gold)]" : "text-zinc-400"}`}>
            {item.title}
          </Link>
        ))}
      </div>
    </div>
  );
}
