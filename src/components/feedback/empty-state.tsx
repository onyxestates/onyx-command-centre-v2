import { Inbox } from "lucide-react";
import { Card } from "@/components/ui/card";

export function EmptyState({ title, description }: { title: string; description: string }) {
  return <Card className="p-10 text-center"><Inbox className="mx-auto mb-3 size-8 text-zinc-500" /><h3 className="text-lg font-semibold">{title}</h3><p className="mt-2 text-sm text-zinc-400">{description}</p></Card>;
}
