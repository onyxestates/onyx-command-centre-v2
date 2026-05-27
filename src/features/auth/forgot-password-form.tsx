"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthCard } from "@/features/auth/auth-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("sophie@northbridgestays.com");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { sendReset } = useAuth();

  return (
    <AuthCard title="Recover access" description="Send a password reset email for an operator account.">
      <form className="space-y-4" onSubmit={async (event) => {
        event.preventDefault();
        setLoading(true);
        setStatus(null);
        setError(null);
        try {
          await sendReset(email);
          setStatus("Reset email sent.");
        } catch (nextError) {
          setError(nextError instanceof Error ? nextError.message : "Unable to send reset email.");
        } finally {
          setLoading(false);
        }
      }}>
        <Input placeholder="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} disabled={loading} />
        {status ? <p className="text-sm text-emerald-300">{status}</p> : null}
        {error ? <p className="text-sm text-rose-300">{error}</p> : null}
        <Button className="w-full" type="submit" disabled={loading}>{loading ? "Sending..." : "Send reset link"}</Button>
      </form>
      <p className="mt-5 text-sm text-zinc-400"><Link href="/login" className="text-[var(--gold)]">Back to login</Link></p>
    </AuthCard>
  );
}
