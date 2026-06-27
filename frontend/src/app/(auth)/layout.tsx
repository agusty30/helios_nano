"use client";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#050816]">
      {/* Animated gradient orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-primary/15 blur-[120px] animate-pulse" style={{ animationDuration: "8s" }} />
        <div className="absolute top-1/3 -right-32 w-[400px] h-[400px] rounded-full bg-[#6366f1]/10 blur-[100px] animate-pulse" style={{ animationDuration: "12s", animationDelay: "2s" }} />
        <div className="absolute -bottom-32 left-1/3 w-[450px] h-[450px] rounded-full bg-[#14b8a6]/8 blur-[100px] animate-pulse" style={{ animationDuration: "10s", animationDelay: "4s" }} />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Content */}
      <div className="relative z-10 w-full max-w-[440px] px-4">
        {children}
      </div>
    </div>
  );
}
