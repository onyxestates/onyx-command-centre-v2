import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

export function AuthCard({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <Card className="w-full max-w-md p-8">
      <div className="mb-8">
        <div className="text-xs uppercase tracking-[0.28em] text-[var(--gold)]">Onyx</div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-zinc-400">{description}</p>
      </div>
      {children}
    </Card>
  );
}
