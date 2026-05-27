import { Skeleton } from "@/components/ui/skeleton";

export function LoadingState() {
  return <div className="grid gap-4 md:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32" />)}</div>;
}
