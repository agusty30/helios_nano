"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Hexagon, Bot, Loader2, Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const result = await Promise.race([
        signIn("credentials", { email, password, redirect: false }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("timeout")), 15000)
        ),
      ]);

      if (!result) {
        setError("Unexpected error. Please try again.");
        setLoading(false);
        return;
      }

      if (result.error) {
        if (result.error.includes("Account locked")) {
          setError(result.error);
        } else if (result.error.includes("EMAIL_NOT_VERIFIED:")) {
          const userEmail = result.error.split("EMAIL_NOT_VERIFIED:")[1];
          router.push(`/verify?email=${encodeURIComponent(userEmail)}`);
          return;
        } else {
          setError("Invalid email or password.");
        }
        setLoading(false);
        return;
      }

      if (result.ok) {
        window.location.href = "/dashboard";
        return;
      }

      setError("Login failed. Please try again.");
      setLoading(false);
    } catch (err) {
      if (err instanceof Error && err.message === "timeout") {
        setError("Request timed out. Please check your connection and try again.");
      } else {
        setError("Connection error. Please check your network and try again.");
      }
      setLoading(false);
    }
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
        <h2 className="text-lg font-semibold text-foreground mb-1">Welcome back</h2>
        <p className="text-[13px] text-muted-dark mb-6">Sign in to your HeliOS dashboard</p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-[12px] text-red-400 flex items-start gap-2">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <span>{error}</span>
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
                disabled={loading}
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-10 pr-3 py-3 text-[13px] text-foreground placeholder-muted-dark/50 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50"
                placeholder="you@company.com"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] text-muted-dark font-medium">Password</label>
              <Link href="/forgot-password" className="text-[11px] text-primary-light hover:text-primary transition-colors">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-dark" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-10 pr-10 py-3 text-[13px] text-foreground placeholder-muted-dark/50 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-dark hover:text-muted transition-colors"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-primary/80 text-white text-[13px] font-semibold py-3 rounded-xl hover:brightness-110 transition-all disabled:opacity-50 shadow-lg shadow-primary/20"
          >
            {loading ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                Sign In
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <span className="text-[12px] text-muted-dark">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-primary-light hover:text-primary font-medium transition-colors">
              Create one
            </Link>
          </span>
        </div>
      </div>

      <p className="text-center text-[10px] text-muted-dark/60 mt-6">
        Powered by Circle Gateway &middot; Arc Testnet &middot; x402 Protocol
      </p>
    </>
  );
}
