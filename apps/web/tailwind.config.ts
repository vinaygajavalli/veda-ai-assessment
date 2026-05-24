import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Clean SaaS palette matching the VedaAI Figma comps
        bg: "#f4f4f6",
        card: "#ffffff",
        ink: "#1a1a1a",
        muted: "#6b7280",
        faint: "#9ca3af",
        line: "#e9e9ee",
        accent: "#e8602c",       // orange CTA
        "accent-dark": "#1e1e1e", // near-black buttons
        easy: "#1f9d57",
        "easy-bg": "#e7f6ee",
        moderate: "#d98a00",
        "moderate-bg": "#fbf0d9",
        hard: "#dc4b3e",
        "hard-bg": "#fbe6e3",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(17,17,26,0.04), 0 4px 16px rgba(17,17,26,0.05)",
        nav: "0 -1px 12px rgba(17,17,26,0.06)",
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
