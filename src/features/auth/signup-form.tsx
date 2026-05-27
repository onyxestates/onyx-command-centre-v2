"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthCard } from "@/features/auth/auth-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export function SignupForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signUpWithEmail } = useAuth();
  const router = useRouter();

  return (
    <AuthCard title="Create operator access" description="Spin up a new team identity and link it to your default workspace.">
      <form className="space-y-4" onSubmit={async (event) => {
        event.preventDefault();
        setError(null);
        setLoading(true);
        try { await signUpWithEmail(name, email, password); router.replace("/dashboard"); }
        catch (nextError) { setError(nextError instanceof Error ? nextError.message : "Unable to sign up."); }
        finally { setLoading(false); }
      }}>
        <Input placeholder="Full name" value={name} onChange={(event) => setName(event.target.value)} disabled={loading} />
        <Input placeholder="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} disabled={loading} />
        <Input placeholder="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} disabled={loading} />
        {error ? <p className="text-sm text-rose-300">{error}</p> : null}
        <Button className="w-full" type="submit" disabled={loading}>{loading ? "Creating account..." : "Create account"}</Button>
      </form>
      <p className="mt-5 text-sm text-zinc-400">Already onboarded? <Link href="/login" className="text-[var(--gold)]">Return to sign in</Link></p>
    </AuthCard>
  );
}
