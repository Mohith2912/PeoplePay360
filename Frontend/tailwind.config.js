/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    "./src/pages/**/*.{js,jsx,mdx}",
    "./src/components/**/*.{js,jsx,mdx}",
    "./src/app/**/*.{js,jsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        base: {
          950: "#050914",
          900: "#0A0F1E",
          800: "#0F172A",
          700: "#1E293B",
          600: "#273449",
        },
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
        cyan: {
          400: "#22D3EE",
          500: "#06B6D4",
          600: "#0891B2",
        },
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
        text: {
          primary:   "#F1F5F9",
          secondary: "#94A3B8",
          muted:     "#475569",
        },
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
      boxShadow: {
        glow:       "0 0 20px rgba(124,58,237,0.3)",
        "glow-sm":  "0 0 10px rgba(124,58,237,0.2)",
        "glow-cyan":"0 0 20px rgba(6,182,212,0.25)",
        card:       "0 4px 24px rgba(0,0,0,0.4)",
        "card-hover":"0 8px 40px rgba(0,0,0,0.6)",
      },
    },
  },
  plugins: [],
};

export default config;
