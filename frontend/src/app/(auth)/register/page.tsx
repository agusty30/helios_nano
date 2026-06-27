"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PasswordStrength from "@/components/auth/PasswordStrength";
import { Hexagon, Bot, Loader2, Mail, Lock, User, Building2, Eye, EyeOff, ArrowRight, ArrowLeft } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const canProceed = step === 1
    ? !!(firstName.trim() && lastName.trim())
    : !!(email.trim() && password.length >= 8 && password === confirmPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      setStep(2);
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email, password, companyName }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        setLoading(false);
        return;
      }

      router.push(`/verify?email=${encodeURIComponent(email)}`);
    } catch {
      setError("Network error. Please try again.");
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

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {[1, 2].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-semibold transition-all ${
              s <= step ? "bg-primary text-white" : "bg-white/5 text-muted-dark border border-white/10"
            }`}>
              {s}
            </div>
            {s < 2 && <div className={`w-8 h-[2px] rounded-full transition-all ${step > 1 ? "bg-primary" : "bg-white/10"}`} />}
          </div>
        ))}
      </div>

      {/* Card */}
      <div className="backdrop-blur-xl bg-white/[0.04] border border-white/[0.08] rounded-2xl p-8 shadow-2xl shadow-black/20">
        <h2 className="text-lg font-semibold text-foreground mb-1">
          {step === 1 ? "Create your account" : "Secure your account"}
        </h2>
        <p className="text-[13px] text-muted-dark mb-6">
          {step === 1 ? "Tell us about yourself" : "Set up your login credentials"}
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-[12px] text-red-400 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 1 ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-muted-dark mb-1.5 block font-medium">First name</label>
                  <div className="relative">
                    <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-dark" />
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-10 pr-3 py-3 text-[13px] text-foreground placeholder-muted-dark/50 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                      placeholder="John"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-muted-dark mb-1.5 block font-medium">Last name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3 py-3 text-[13px] text-foreground placeholder-muted-dark/50 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-muted-dark mb-1.5 block font-medium">Company name <span className="text-muted-dark/50">(optional)</span></label>
                <div className="relative">
                  <Building2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-dark" />
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-10 pr-3 py-3 text-[13px] text-foreground placeholder-muted-dark/50 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                    placeholder="Acme Corp"
                  />
                </div>
              </div>
            </>
          ) : (
            <>
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

              <div>
                <label className="text-[11px] text-muted-dark mb-1.5 block font-medium">Password</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-dark" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-10 pr-10 py-3 text-[13px] text-foreground placeholder-muted-dark/50 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                    placeholder="Min. 8 characters"
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
            </>
          )}

          <div className="flex gap-3">
            {step === 2 && (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center justify-center gap-1 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-[13px] text-muted hover:text-foreground hover:bg-white/[0.06] transition-all"
              >
                <ArrowLeft size={14} />
              </button>
            )}
            <button
              type="submit"
              disabled={loading || !canProceed}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-primary/80 text-white text-[13px] font-semibold py-3 rounded-xl hover:brightness-110 transition-all disabled:opacity-50 shadow-lg shadow-primary/20"
            >
              {loading ? (
                <Loader2 size={15} className="animate-spin" />
              ) : step === 1 ? (
                <>
                  Continue
                  <ArrowRight size={14} />
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>

          {step === 2 && !canProceed && (email || password || confirmPassword) && (
            <p className="text-[10px] text-muted-dark text-center">
              {!email.trim() ? "Enter your email address" :
               password.length < 8 ? `Password needs ${8 - password.length} more character${8 - password.length === 1 ? "" : "s"}` :
               password !== confirmPassword ? "Passwords must match" : ""}
            </p>
          )}
        </form>

        <div className="mt-6 text-center">
          <span className="text-[12px] text-muted-dark">
            Already have an account?{" "}
            <Link href="/login" className="text-primary-light hover:text-primary font-medium transition-colors">
              Sign in
            </Link>
          </span>
        </div>
      </div>

      <p className="text-center text-[10px] text-muted-dark/60 mt-6">
        By creating an account, you agree to our Terms of Service
      </p>
    </>
  );
}
