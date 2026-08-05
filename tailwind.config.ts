import path from "node:path";
import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const projectRoot = path.resolve(__dirname);
const contentGlob = path
  .join(projectRoot, "src/**/*.{js,ts,jsx,tsx,mdx}")
  .replace(/\\/g, "/");

const config: Config = {
  darkMode: "class",
  content: [contentGlob],
  theme: {
    extend: {
      screens: {
        xs: "375px",
        sm: "500px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1440px",
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        anchor: {
          navy: "#0F2A3D",
          teal: "#1A6B6B",
          sand: "#F5F0E8",
          coral: "#C96B52",
          sage: "#5C7A6B",
        },
        system: {
          success: "#2D8A5E",
          warning: "#C4842D",
          error: "#C44536",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      transitionTimingFunction: {
        premium: "cubic-bezier(0.32, 0.72, 0, 1)",
      },
      boxShadow: {
        soft: "0 2px 12px rgba(15, 42, 61, 0.06)",
        elevated: "0 8px 32px rgba(15, 42, 61, 0.1)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-up": {
          "0%": { transform: "translateY(8px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.2s ease-out",
        "slide-up": "slide-up 0.3s ease-out",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
