import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0B1020",
        card: "#151B2E",
        "card-hover": "#1A2238",
        primary: "#4F46E5",
        "primary-light": "#6366F1",
        success: "#10B981",
        warning: "#F59E0B",
        danger: "#EF4444",
        foreground: "#F8FAFC",
        muted: "#94A3B8",
        "muted-dark": "#64748B",
        border: "#1E293B",
        "border-light": "#334155",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out both",
        "slide-up": "slideUp 0.4s ease-out both",
        "slide-right": "slideRight 0.3s ease-out both",
        "pulse-slow": "pulse 3s ease-in-out infinite",
        "glow": "glow 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideUp: { "0%": { opacity: "0", transform: "translateY(12px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        slideRight: { "0%": { opacity: "0", transform: "translateX(-8px)" }, "100%": { opacity: "1", transform: "translateX(0)" } },
        glow: { "0%,100%": { boxShadow: "0 0 0 0 rgba(79,70,229,0.2)" }, "50%": { boxShadow: "0 0 20px 4px rgba(79,70,229,0.15)" } },
      },
    },
  },
  plugins: [],
};

export default config;
