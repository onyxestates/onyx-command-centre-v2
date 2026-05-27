import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { getServerSession } from "@/lib/auth/session";

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession();
  if (!session) {
    redirect("/login");
  }

  return <AppShell>{children}</AppShell>;
}
