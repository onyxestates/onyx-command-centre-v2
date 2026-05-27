import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/session";

export default async function AuthLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession();
  if (session) {
    redirect("/dashboard");
  }

  return <main className="onyx-grid flex min-h-screen items-center justify-center px-4 py-10">{children}</main>;
}
