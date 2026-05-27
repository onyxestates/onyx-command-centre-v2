import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export function Button({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={cn("inline-flex items-center justify-center rounded-xl border border-white/10 bg-[var(--gold)] px-4 py-2 text-sm font-semibold text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50", className)} {...props} />;
}
