"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import PasswordStrength from "@/components/auth/PasswordStrength";
import { Hexagon, Bot, Loader2, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";

function ResetContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Reset failed");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
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
          <h2 className="text-lg font-semibold text-foreground mb-2">Password Reset!</h2>
          <p className="text-[13px] text-muted-dark mb-4">Your password has been updated. Redirecting to sign in...</p>
          <Loader2 size={20} className="animate-spin text-primary mx-auto" />
        </div>
      </>
    );
  }

  if (!token || !email) {
    return (
      <div className="backdrop-blur-xl bg-white/[0.04] border border-white/[0.08] rounded-2xl p-8 shadow-2xl shadow-black/20 text-center">
        <h2 className="text-lg font-semibold text-foreground mb-2">Invalid Reset Link</h2>
        <p className="text-[13px] text-muted-dark mb-4">This link is invalid or has expired.</p>
        <Link href="/forgot-password" className="inline-flex items-center gap-2 text-[13px] text-primary-light hover:text-primary font-medium transition-colors">
          Request a new reset link
          <ArrowRight size={14} />
        </Link>
      </div>
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
        <h2 className="text-lg font-semibold text-foreground mb-1">Set new password</h2>
        <p className="text-[13px] text-muted-dark mb-6">Choose a strong password for your account</p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-[12px] text-red-400 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[11px] text-muted-dark mb-1.5 block font-medium">New password</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-dark" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={12}
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-10 pr-10 py-3 text-[13px] text-foreground placeholder-muted-dark/50 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                placeholder="Min. 12 characters"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-dark hover:text-muted transition-colors"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <PasswordStrength password={password} />
          </div>

          <div>
            <label className="text-[11px] text-muted-dark mb-1.5 block font-medium">Confirm password</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-dark" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-10 pr-3 py-3 text-[13px] text-foreground placeholder-muted-dark/50 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                placeholder="Re-enter your password"
              />
            </div>
            {confirmPassword && confirmPassword !== password && (
              <p className="text-[10px] text-red-400 mt-1">Passwords do not match</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || password.length < 12 || password !== confirmPassword}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-primary/80 text-white text-[13px] font-semibold py-3 rounded-xl hover:brightness-110 transition-all disabled:opacity-50 shadow-lg shadow-primary/20"
          >
            {loading ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <>
                Reset Password
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
      </div>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<Loader2 size={24} className="animate-spin text-primary mx-auto" />}>
      <ResetContent />
    </Suspense>
  );
}
