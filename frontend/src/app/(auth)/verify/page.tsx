"use client";

import { useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import VerifyCodeInput from "@/components/auth/VerifyCodeInput";
import { Hexagon, Bot, Loader2, CheckCircle2, Mail, RotateCcw } from "lucide-react";

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  const handleVerify = useCallback(async (code: string) => {
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Verification failed");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }, [email, router]);

  const handleResend = async () => {
    setResending(true);
    setResendMessage("");
    try {
      const res = await fetch("/api/auth/resend-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setResendMessage(data.error || data.message || "Code sent");
    } catch {
      setResendMessage("Failed to resend");
    }
    setResending(false);
  };

  if (success) {
    return (
      <>
        <div className="flex items-center justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <CheckCircle2 size={32} className="text-emerald-400" />
          </div>
        </div>
        <div className="backdrop-blur-xl bg-white/[0.04] border border-white/[0.08] rounded-2xl p-8 shadow-2xl shadow-black/20 text-center">
          <h2 className="text-lg font-semibold text-foreground mb-2">Email Verified!</h2>
          <p className="text-[13px] text-muted-dark mb-4">Your account is now active. Redirecting to sign in...</p>
          <Loader2 size={20} className="animate-spin text-primary mx-auto" />
        </div>
      </>
    );
  }

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
        <div className="flex items-center justify-center mb-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Mail size={22} className="text-primary-light" />
          </div>
        </div>

        <h2 className="text-lg font-semibold text-foreground text-center mb-1">Check your email</h2>
        <p className="text-[13px] text-muted-dark text-center mb-6">
          We sent a 6-digit code to <span className="text-foreground font-medium">{email}</span>
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-[12px] text-red-400 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
            {error}
          </div>
        )}

        <div className="mb-6">
          <VerifyCodeInput onComplete={handleVerify} disabled={loading} />
          {loading && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <Loader2 size={14} className="animate-spin text-primary" />
              <span className="text-[12px] text-muted-dark">Verifying...</span>
            </div>
          )}
        </div>

        <div className="text-center space-y-3">
          <button
            onClick={handleResend}
            disabled={resending}
            className="inline-flex items-center gap-1.5 text-[12px] text-primary-light hover:text-primary transition-colors disabled:opacity-50"
          >
            <RotateCcw size={12} className={resending ? "animate-spin" : ""} />
            Resend code
          </button>
          {resendMessage && (
            <p className="text-[11px] text-muted-dark">{resendMessage}</p>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-white/[0.06] text-center">
          <Link href="/login" className="text-[12px] text-muted-dark hover:text-muted transition-colors">
            Back to sign in
          </Link>
        </div>
      </div>
    </>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<Loader2 size={24} className="animate-spin text-primary mx-auto" />}>
      <VerifyContent />
    </Suspense>
  );
}
