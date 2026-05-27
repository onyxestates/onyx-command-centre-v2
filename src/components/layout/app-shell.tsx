"use client";

import { useEffect, useMemo, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AccessState } from "@/components/feedback/access-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { NAV_ITEMS } from "@/config/navigation";
import { useAuth } from "@/hooks/use-auth";
import { hasPermission } from "@/lib/utils/permissions";

function resolveRoutePermission(pathname: string) {
  return NAV_ITEMS.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
}

export function AppShell({ children }: { children: ReactNode }) {
  const { user, member, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const route = useMemo(() => resolveRoutePermission(pathname), [pathname]);
  const hasRouteAccess = !route?.permission || hasPermission(member, route.permission);
  const hasActiveMembership = Boolean(member && member.status === "active");

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (hasActiveMembership && !hasRouteAccess) {
      router.replace("/dashboard");
    }
  }, [hasActiveMembership, hasRouteAccess, loading, router, user]);

  if (loading) {
    return (
      <main className="min-h-screen p-6">
        <LoadingState />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen p-6">
        <LoadingState />
      </main>
    );
  }

  if (!hasActiveMembership) {
    return (
      <main className="min-h-screen p-6">
        <AccessState
          title="Workspace access required"
          description="Your account is authenticated, but it does not have an active workspace membership yet. Ask an administrator to restore or create your access."
        />
      </main>
    );
  }

  if (!hasRouteAccess) {
    return (
      <main className="min-h-screen p-6">
        <AccessState description="Your current role does not include access to this module. You have been redirected to the operations dashboard." />
      </main>
    );
  }

  return (
    <div className="min-h-screen lg:flex">
      <Sidebar member={member} />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 p-4 pb-24 md:p-6 lg:p-8">{children}</main>
        <MobileNav member={member} />
      </div>
    </div>
  );
}
