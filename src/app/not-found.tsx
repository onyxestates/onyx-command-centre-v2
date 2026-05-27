import Link from "next/link";
import { EmptyState } from "@/components/feedback/empty-state";

export default function NotFound() {
  return <main className="min-h-screen p-6"><EmptyState title="Page not found" description="The requested Onyx module could not be found. Return to the dashboard to continue." /><div className="mt-4 text-center text-sm text-[var(--gold)]"><Link href="/dashboard">Go to dashboard</Link></div></main>;
}
