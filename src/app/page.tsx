"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoadingState } from "@/components/feedback/loading-state";
import { useAuth } from "@/hooks/use-auth";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading) router.replace(user ? "/dashboard" : "/login");
  }, [loading, router, user]);
  return <main className="min-h-screen p-6"><LoadingState /></main>;
}
