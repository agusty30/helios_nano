"use client";

import { useState } from "react";
import Link from "next/link";
import { Hexagon, Bot, Loader2, Mail, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to send reset email");
        setLoading(false);
        return;
      }

      setSent(true);
    } catch {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  };

  return (
    <>
      {/* Logo */}
      <div className="flex items-center justify-center gap-3 mb-8">
        <div className="relative">
          <Hexagon size={36} className="text-primary" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Bot size={17} className="text-primary-light" />
          </div>
        </div>
        <div>
          <span className="text-xl font-bold tracking-tight text-foreground">HeliOS</span>
          <span className="block text-[10px] text-muted-dark font-medium uppercase tracking-[0.15em]">AI Financial OS</span>
        </div>
      </div>

      {/* Card */}
      <div className="backdrop-blur-xl bg-white/[0.04] border border-white/[0.08] rounded-2xl p-8 shadow-2xl shadow-black/20">
        {sent ? (
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 size={22} className="text-emerald-400" />
              </div>
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">Check your email</h2>
            <p className="text-[13px] text-muted-dark mb-6">
              If an account exists for <span className="text-foreground font-medium">{email}</span>,
              we&apos;ve sent a password reset link.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-[13px] text-primary-light hover:text-primary font-medium transition-colors"
            >
              <ArrowLeft size={14} />
              Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-semibold text-foreground mb-1">Reset your password</h2>
            <p className="text-[13px] text-muted-dark mb-6">
              Enter the email address associated with your account and we&apos;ll send a reset link.
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-[12px] text-red-400 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[11px] text-muted-dark mb-1.5 block font-medium">Email address</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-dark" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-10 pr-3 py-3 text-[13px] text-foreground placeholder-muted-dark/50 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                    placeholder="you@company.com"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-primary/80 text-white text-[13px] font-semibold py-3 rounded-xl hover:brightness-110 transition-all disabled:opacity-50 shadow-lg shadow-primary/20"
              >
                {loading ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <>
                    Send Reset Link
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link href="/login" className="inline-flex items-center gap-1 text-[12px] text-muted-dark hover:text-muted transition-colors">
                <ArrowLeft size={12} />
                Back to sign in
              </Link>
            </div>
          </>
        )}
      </div>
    </>
  );
}
