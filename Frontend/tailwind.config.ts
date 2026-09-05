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
        // Base backgrounds
        base: {
          950: "#050914",
          900: "#0A0F1E",
          800: "#0F172A",
          700: "#1E293B",
          600: "#273449",
        },
        // Primary accent — Electric Violet
        primary: {
          50:  "#F5F3FF",
          100: "#EDE9FE",
          200: "#DDD6FE",
          300: "#C4B5FD",
          400: "#A78BFA",
          500: "#8B5CF6",
          600: "#7C3AED",
          700: "#6D28D9",
          800: "#5B21B6",
          900: "#4C1D95",
        },
        // Secondary accent — Cyan
        cyan: {
          400: "#22D3EE",
          500: "#06B6D4",
          600: "#0891B2",
        },
        // Semantic
        success: {
          400: "#34D399",
          500: "#10B981",
          900: "#064E3B",
        },
        warning: {
          400: "#FBBF24",
          500: "#F59E0B",
          900: "#451A03",
        },
        danger: {
          400: "#F87171",
          500: "#EF4444",
          900: "#450A0A",
        },
        // Text
        text: {
          primary:   "#F1F5F9",
          secondary: "#94A3B8",
          muted:     "#475569",
        },
        // Border
        border: {
          DEFAULT: "#1E293B",
          subtle:  "#0F172A",
          strong:  "#334155",
        },
      },
      fontFamily: {
        sans:    ["Inter", "system-ui", "sans-serif"],
        heading: ["Manrope", "Inter", "sans-serif"],
        mono:    ["JetBrains Mono", "monospace"],
      },
      backgroundImage: {
        "gradient-primary": "linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%)",
        "gradient-card":    "linear-gradient(145deg, rgba(30,41,59,0.8) 0%, rgba(15,23,42,0.9) 100%)",
        "gradient-sidebar": "linear-gradient(180deg, #0A0F1E 0%, #050914 100%)",
        "gradient-hero":    "radial-gradient(ellipse at 20% 50%, rgba(124,58,237,0.15) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(6,182,212,0.10) 0%, transparent 60%)",
      },
      boxShadow: {
        glow:       "0 0 20px rgba(124,58,237,0.3)",
        "glow-sm":  "0 0 10px rgba(124,58,237,0.2)",
        "glow-cyan":"0 0 20px rgba(6,182,212,0.25)",
        card:       "0 4px 24px rgba(0,0,0,0.4)",
        "card-hover":"0 8px 40px rgba(0,0,0,0.6)",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      backdropBlur: {
        xs: "2px",
      },
      animation: {
        "fade-in":      "fadeIn 0.3s ease-out",
        "slide-up":     "slideUp 0.3s ease-out",
        "slide-in-left":"slideInLeft 0.3s ease-out",
        "pulse-slow":   "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "shimmer":      "shimmer 1.5s infinite",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(12px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        slideInLeft: {
          from: { opacity: "0", transform: "translateX(-16px)" },
          to:   { opacity: "1", transform: "translateX(0)" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition:  "200% 0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
