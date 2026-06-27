"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Hexagon, Bot, ArrowRight, ChevronDown, Zap, Shield, BarChart3, Wallet,
  CreditCard, ShoppingCart, Landmark, PieChart, Check, Globe, Lock,
  Code, Cpu, TrendingDown, DollarSign, Menu, X,
} from "lucide-react";

function Navbar() {
  const { data: session } = useSession();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    { label: "Features", href: "#features" },
    { label: "Agents", href: "#agents" },
    { label: "Pricing", href: "#pricing" },
    { label: "FAQ", href: "#faq" },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? "bg-[#050816]/80 backdrop-blur-xl border-b border-white/[0.06]" : ""
    }`}>
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="relative">
            <Hexagon size={26} className="text-primary" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Bot size={12} className="text-primary-light" />
            </div>
          </div>
          <span className="text-[15px] font-bold tracking-tight text-foreground">HeliOS</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((l) => (
            <a key={l.href} href={l.href} className="text-[13px] text-muted hover:text-foreground transition-colors">{l.label}</a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          {session ? (
            <Link href="/dashboard" className="flex items-center gap-2 bg-primary text-white text-[13px] font-semibold px-5 py-2 rounded-lg hover:brightness-110 transition-all">
              Dashboard <ArrowRight size={14} />
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-[13px] text-muted hover:text-foreground transition-colors px-4 py-2">
                Sign In
              </Link>
              <Link href="/register" className="bg-primary text-white text-[13px] font-semibold px-5 py-2 rounded-lg hover:brightness-110 transition-all">
                Get Started
              </Link>
            </>
          )}
        </div>

        <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden text-muted">
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-[#050816]/95 backdrop-blur-xl border-b border-white/[0.06] px-6 pb-4">
          {navLinks.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setMobileOpen(false)} className="block py-2.5 text-[13px] text-muted hover:text-foreground">{l.label}</a>
          ))}
          <div className="flex gap-3 mt-3">
            {session ? (
              <Link href="/dashboard" className="flex-1 text-center bg-primary text-white text-[13px] font-semibold px-5 py-2.5 rounded-lg">Dashboard</Link>
            ) : (
              <>
                <Link href="/login" className="flex-1 text-center text-[13px] text-muted border border-white/10 py-2.5 rounded-lg">Sign In</Link>
                <Link href="/register" className="flex-1 text-center bg-primary text-white text-[13px] font-semibold py-2.5 rounded-lg">Get Started</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

function Hero() {
  return (
    <section className="relative pt-32 pb-24 overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full bg-primary/10 blur-[150px]" />
        <div className="absolute top-20 -right-40 w-[400px] h-[400px] rounded-full bg-[#6366f1]/8 blur-[120px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-8">
          <Zap size={12} className="text-primary-light" />
          <span className="text-[11px] font-semibold text-primary-light tracking-wide">AUTONOMOUS AI FINANCE</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground leading-[1.1] max-w-4xl mx-auto">
          The AI Operating System for{" "}
          <span className="bg-gradient-to-r from-primary-light via-[#818cf8] to-[#6366f1] bg-clip-text text-transparent">
            Autonomous Finance
          </span>
        </h1>

        <p className="mt-6 text-lg text-muted max-w-2xl mx-auto leading-relaxed">
          AI agents that manage budgets, execute payments, optimize API costs, and operate treasury wallets — autonomously, on-chain, in real time.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
          <Link href="/register" className="flex items-center gap-2 bg-primary text-white text-[14px] font-semibold px-8 py-3.5 rounded-xl hover:brightness-110 transition-all shadow-lg shadow-primary/25">
            Start Building <ArrowRight size={16} />
          </Link>
          <a href="#features" className="flex items-center gap-2 text-[14px] text-muted hover:text-foreground px-8 py-3.5 rounded-xl border border-white/10 hover:border-white/20 transition-all">
            Explore Features <ChevronDown size={16} />
          </a>
        </div>

        <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl mx-auto">
          {[
            { value: "$2.4M+", label: "Processed" },
            { value: "99.9%", label: "Uptime" },
            { value: "<50ms", label: "Latency" },
            { value: "4", label: "AI Agents" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-2xl font-bold text-foreground">{s.value}</div>
              <div className="text-[11px] text-muted-dark mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Features() {
  const features = [
    { icon: PieChart, title: "Budget Optimization", desc: "AI-driven budget allocation that learns spending patterns and automatically reallocates resources for maximum efficiency." },
    { icon: TrendingDown, title: "API Cost Optimization", desc: "Multi-provider LLM routing that intelligently selects the cheapest model per task, saving up to 60% on AI infrastructure." },
    { icon: Wallet, title: "Treasury Wallet", desc: "On-chain USDC treasury with real-time balance tracking, automated settlements, and complete audit trail on Arc Testnet." },
    { icon: Zap, title: "Autonomous Payments", desc: "x402 protocol-powered nanopayments that execute instantly without human intervention, with configurable approval thresholds." },
    { icon: Shield, title: "Enterprise Security", desc: "Account lockout protection, email-verified authentication, encrypted secrets, and comprehensive audit logging." },
    { icon: Globe, title: "On-Chain Settlement", desc: "Every transaction settles on-chain via Circle Gateway. Full transparency, immutable records, real-time verification." },
  ];

  return (
    <section id="features" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-[11px] font-semibold text-primary-light tracking-[0.2em] uppercase">Features</span>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mt-3">Everything you need to automate finance</h2>
          <p className="text-muted mt-4 max-w-xl mx-auto">Built for AI-native companies that want to put financial operations on autopilot.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="group p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-primary/30 hover:bg-white/[0.04] transition-all duration-300">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <f.icon size={20} className="text-primary-light" />
              </div>
              <h3 className="text-[15px] font-semibold text-foreground mb-2">{f.title}</h3>
              <p className="text-[13px] text-muted leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Agents() {
  const agents = [
    { icon: CreditCard, name: "Payment Agent", desc: "Executes x402 nanopayments, manages settlement queues, and handles payment routing across providers.", status: "Active" },
    { icon: ShoppingCart, name: "Procurement Agent", desc: "Automates vendor selection, negotiates API pricing, and manages service-level agreements.", status: "Active" },
    { icon: Landmark, name: "Treasury Agent", desc: "Manages USDC treasury balances, executes fund allocations, and monitors wallet health.", status: "Active" },
    { icon: PieChart, name: "Budget Agent", desc: "Tracks spend against budgets, triggers alerts on overruns, and auto-reallocates unused funds.", status: "Active" },
  ];

  return (
    <section id="agents" className="py-24 relative">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/2 left-0 w-[400px] h-[400px] rounded-full bg-primary/5 blur-[120px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-[11px] font-semibold text-primary-light tracking-[0.2em] uppercase">AI Agents</span>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mt-3">Four autonomous agents, one mission</h2>
          <p className="text-muted mt-4 max-w-xl mx-auto">Each agent operates independently, making decisions in real time based on your policies and budgets.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {agents.map((a) => (
            <div key={a.name} className="flex gap-4 p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-primary/20 transition-all">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <a.icon size={22} className="text-primary-light" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-[14px] font-semibold text-foreground">{a.name}</h3>
                  <span className="text-[10px] font-medium text-success bg-success/10 px-2 py-0.5 rounded-full">{a.status}</span>
                </div>
                <p className="text-[12px] text-muted leading-relaxed">{a.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { num: "01", icon: Wallet, title: "Connect Wallet", desc: "Link your USDC treasury wallet on Arc Testnet. HeliOS manages the funds your agents can access." },
    { num: "02", icon: Lock, title: "Set Policies & Budgets", desc: "Define daily limits, approval thresholds, and budget allocations. Your agents operate within these guardrails." },
    { num: "03", icon: Cpu, title: "AI Operates Autonomously", desc: "Agents execute payments, optimize costs, and manage treasury — 24/7, with full audit trails." },
  ];

  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-[11px] font-semibold text-primary-light tracking-[0.2em] uppercase">How It Works</span>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mt-3">Up and running in minutes</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((s) => (
            <div key={s.num} className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-5">
                <s.icon size={24} className="text-primary-light" />
              </div>
              <span className="text-[10px] font-bold text-primary-light tracking-widest">{s.num}</span>
              <h3 className="text-[15px] font-semibold text-foreground mt-2 mb-2">{s.title}</h3>
              <p className="text-[12px] text-muted leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  const plans = [
    {
      name: "Starter", price: "Free", period: "", desc: "For testing and development",
      features: ["1 AI Agent", "100 transactions/day", "Arc Testnet only", "Email support", "Basic analytics"],
      cta: "Start Free", primary: false,
    },
    {
      name: "Pro", price: "$99", period: "/mo", desc: "For growing teams",
      features: ["4 AI Agents", "Unlimited transactions", "Multi-chain support", "Priority support", "Advanced analytics", "Custom policies", "API access"],
      cta: "Start Trial", primary: true,
    },
    {
      name: "Enterprise", price: "Custom", period: "", desc: "For large organizations",
      features: ["Unlimited agents", "Dedicated infrastructure", "SSO & SAML", "24/7 phone support", "Custom integrations", "SLA guarantee", "On-premise option"],
      cta: "Contact Sales", primary: false,
    },
  ];

  return (
    <section id="pricing" className="py-24 relative">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[150px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-[11px] font-semibold text-primary-light tracking-[0.2em] uppercase">Pricing</span>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mt-3">Simple, transparent pricing</h2>
          <p className="text-muted mt-4">Start free, scale when you need to.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((p) => (
            <div key={p.name} className={`rounded-2xl p-7 flex flex-col ${
              p.primary
                ? "bg-primary/[0.08] border-2 border-primary/30 relative"
                : "bg-white/[0.02] border border-white/[0.06]"
            }`}>
              {p.primary && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-bold px-4 py-1 rounded-full tracking-wide">
                  POPULAR
                </div>
              )}
              <h3 className="text-[15px] font-semibold text-foreground">{p.name}</h3>
              <div className="mt-3 mb-1">
                <span className="text-3xl font-bold text-foreground">{p.price}</span>
                <span className="text-muted text-[13px]">{p.period}</span>
              </div>
              <p className="text-[12px] text-muted-dark mb-6">{p.desc}</p>
              <ul className="space-y-2.5 mb-8 flex-1">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-[12px] text-muted">
                    <Check size={14} className="text-success shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/register" className={`text-center text-[13px] font-semibold py-2.5 rounded-xl transition-all ${
                p.primary
                  ? "bg-primary text-white hover:brightness-110 shadow-lg shadow-primary/20"
                  : "bg-white/[0.04] text-foreground border border-white/10 hover:border-white/20"
              }`}>
                {p.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const items = [
    { q: "What blockchain does HeliOS use?", a: "HeliOS operates on Arc Testnet (Chain ID 5042002) with USDC settlements via Circle Gateway. We plan to support mainnet and additional EVM chains." },
    { q: "How do autonomous payments work?", a: "Using the x402 protocol, AI agents can execute micro-payments without human approval (within your configured thresholds). Every transaction is signed on-chain with full audit trails." },
    { q: "Is my treasury wallet secure?", a: "Yes. Wallets are managed through Circle Gateway with enterprise-grade security. You set daily limits, per-transaction caps, and approval thresholds. Agents cannot exceed your policies." },
    { q: "Can I control what agents spend?", a: "Absolutely. You define budgets, daily limits, per-agent caps, and approval thresholds. The Budget Agent monitors all spending in real time and triggers alerts on anomalies." },
    { q: "What LLM providers do you support?", a: "HeliOS routes between OpenAI, Anthropic, and OpenRouter. Our cost optimizer selects the cheapest capable model per task, saving up to 60% on inference costs." },
    { q: "How do I get started?", a: "Sign up for a free account, connect your testnet wallet, set a budget, and your agents start operating immediately. No credit card required for the Starter plan." },
  ];

  return (
    <section id="faq" className="py-24">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-[11px] font-semibold text-primary-light tracking-[0.2em] uppercase">FAQ</span>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mt-3">Frequently asked questions</h2>
        </div>

        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="rounded-xl border border-white/[0.06] overflow-hidden">
              <button
                onClick={() => setOpenIdx(openIdx === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-white/[0.02] transition-colors"
              >
                <span className="text-[13px] font-medium text-foreground pr-4">{item.q}</span>
                <ChevronDown size={16} className={`text-muted-dark shrink-0 transition-transform ${openIdx === i ? "rotate-180" : ""}`} />
              </button>
              {openIdx === i && (
                <div className="px-5 pb-5 -mt-1">
                  <p className="text-[12px] text-muted leading-relaxed">{item.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/[0.06] py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="relative">
                <Hexagon size={20} className="text-primary" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Bot size={9} className="text-primary-light" />
                </div>
              </div>
              <span className="text-[14px] font-bold text-foreground">HeliOS</span>
            </div>
            <p className="text-[11px] text-muted-dark leading-relaxed">Autonomous AI Financial Operating System for the on-chain economy.</p>
          </div>

          <div>
            <h4 className="text-[11px] font-semibold text-muted-dark uppercase tracking-[0.15em] mb-3">Product</h4>
            <div className="space-y-2">
              {["Features", "Agents", "Pricing", "Documentation"].map((l) => (
                <a key={l} href={`#${l.toLowerCase()}`} className="block text-[12px] text-muted hover:text-foreground transition-colors">{l}</a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-[11px] font-semibold text-muted-dark uppercase tracking-[0.15em] mb-3">Company</h4>
            <div className="space-y-2">
              {["About", "Blog", "Careers", "Contact"].map((l) => (
                <a key={l} href="#" className="block text-[12px] text-muted hover:text-foreground transition-colors">{l}</a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-[11px] font-semibold text-muted-dark uppercase tracking-[0.15em] mb-3">Legal</h4>
            <div className="space-y-2">
              {["Privacy Policy", "Terms of Service", "Security"].map((l) => (
                <a key={l} href="#" className="block text-[12px] text-muted hover:text-foreground transition-colors">{l}</a>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between pt-8 border-t border-white/[0.04]">
          <p className="text-[11px] text-muted-dark">&copy; 2026 HeliOS. All rights reserved.</p>
          <div className="flex items-center gap-4 mt-3 sm:mt-0">
            <span className="text-[10px] text-muted-dark">Powered by</span>
            <div className="flex items-center gap-3 text-[10px] text-muted-dark">
              <span className="flex items-center gap-1"><Code size={10} /> x402</span>
              <span className="flex items-center gap-1"><DollarSign size={10} /> Circle</span>
              <span className="flex items-center gap-1"><Globe size={10} /> Arc</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#050816]">
      <Navbar />
      <Hero />
      <Features />
      <Agents />
      <HowItWorks />
      <Pricing />
      <FAQ />
      <Footer />
    </div>
  );
}
