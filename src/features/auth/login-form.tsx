"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AuthCard } from "@/features/auth/auth-card";
import { useAuth } from "@/hooks/use-auth";

export function LoginForm() {
  const [email, setEmail] = useState("daniel@northbridgestays.com");
  const [password, setPassword] = useState("OnyxDemo!2026");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signInWithEmail } = useAuth();
  const router = useRouter();

  return (
    <AuthCard title="Command centre login" description="Access operations, guest communications, cleanings, maintenance, and reporting.">
      <form className="space-y-4" onSubmit={async (event) => {
        event.preventDefault();
        setLoading(true);
        setError(null);
        try { await signInWithEmail(email, password); router.replace("/dashboard"); }
        catch (nextError) { setError(nextError instanceof Error ? nextError.message : "Login failed."); }
        finally { setLoading(false); }
      }}>
        <Input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" type="email" />
        <Input value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" type="password" />
        {error ? <p className="text-sm text-rose-300">{error}</p> : null}
        <Button className="w-full" disabled={loading} type="submit">{loading ? "Signing in..." : "Sign in"}</Button>
      </form>
      <div className="mt-5 flex justify-between text-sm text-zinc-400">
        <Link href="/forgot-password">Forgot password</Link>
        <Link href="/signup">Create account</Link>
      </div>
    </AuthCard>
  );
}
