import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none ring-0 placeholder:text-zinc-500 focus:border-[var(--gold)]", className)} {...props} />;
}
