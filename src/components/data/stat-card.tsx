import { ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";

export function StatCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-zinc-400">{label}</p>
          <p className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">{value}</p>
        </div>
        <span className="rounded-full bg-[var(--gold-soft)] p-2 text-[var(--gold)]"><ArrowUpRight className="size-4" /></span>
      </div>
      <p className="mt-4 text-xs text-zinc-500">{hint}</p>
    </Card>
  );
}
