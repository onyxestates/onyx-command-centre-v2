import { Lock } from "lucide-react";
import { Card } from "@/components/ui/card";

export function AccessState({ title = "Restricted area", description = "Your role does not currently have permission to access this module." }: { title?: string; description?: string }) {
  return <Card className="p-10 text-center"><Lock className="mx-auto mb-3 size-8 text-[var(--gold)]" /><h3 className="text-lg font-semibold">{title}</h3><p className="mt-2 text-sm text-zinc-400">{description}</p></Card>;
}
