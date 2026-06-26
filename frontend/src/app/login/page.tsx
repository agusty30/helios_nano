"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Hexagon, Bot, Loader2 } from "lucide-react";

export default function LoginPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    let result;
    if (mode === "login") {
      result = await login(email, password);
    } else {
      result = await register({ name, email, password, companyName });
    }

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      window.location.href = "/";
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-[400px]">
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

        <div className="glass-bright rounded-xl p-8">
          <h2 className="text-lg font-semibold text-foreground mb-1">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h2>
          <p className="text-[13px] text-muted-dark mb-6">
            {mode === "login" ? "Sign in to your HeliOS dashboard" : "Set up your organization"}
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-danger/10 border border-danger/20 text-[12px] text-danger">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <>
                <div>
                  <label className="text-[11px] text-muted-dark mb-1.5 block">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full bg-bg border border-border rounded-lg px-3 py-2.5 text-[13px] text-foreground placeholder-muted-dark focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-muted-dark mb-1.5 block">Company Name</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full bg-bg border border-border rounded-lg px-3 py-2.5 text-[13px] text-foreground placeholder-muted-dark focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                    placeholder="Acme Corp"
                  />
                </div>
              </>
            )}

            <div>
              <label className="text-[11px] text-muted-dark mb-1.5 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-bg border border-border rounded-lg px-3 py-2.5 text-[13px] text-foreground placeholder-muted-dark focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                placeholder="you@company.com"
              />
            </div>

            <div>
              <label className="text-[11px] text-muted-dark mb-1.5 block">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full bg-bg border border-border rounded-lg px-3 py-2.5 text-[13px] text-foreground placeholder-muted-dark focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                placeholder="Min. 8 characters"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-primary text-white text-[13px] font-medium py-2.5 rounded-lg hover:bg-primary/80 transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : null}
              {mode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
              className="text-[12px] text-muted hover:text-primary-light transition-colors"
            >
              {mode === "login" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>

        <p className="text-center text-[10px] text-muted-dark mt-6">
          Powered by Circle Gateway &middot; Arc Testnet &middot; x402 Protocol
        </p>
      </div>
    </div>
  );
}
