import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#09090b",
        surface: "#111113",
        surface2: "#18181b",
        surface3: "#1c1c20",
        border: "#27272a",
        mint: "#10b981",
        crimson: "#ef4444",
        gold: "#f59e0b",
        accent: "#6366f1",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "ui-monospace", "monospace"],
      },
      animation: {
        "orbit": "orbit 8s linear infinite",
        "orbit-reverse": "orbit-reverse 12s linear infinite",
        "spin-slow": "spin-ring 20s linear infinite",
        "ripple": "ripple 1s ease-out forwards",
        "slide-up": "slide-up-in 0.3s ease-out both",
        "fade-in": "fade-in 0.4s ease-out both",
        "glow-breathe": "glow-breathe 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
