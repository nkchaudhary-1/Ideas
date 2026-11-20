import type { Config } from "tailwindcss";

// Every colour is a CSS variable holding "r g b", so one class works in light and dark and takes /opacity.
const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: token("c-bg"), //        page behind the cards
        stage: token("c-stage"), //  canvas ground
        panel: token("c-panel"), //  cards
        panel2: token("c-panel2"), // quiet surfaces inside cards
        raised: token("c-raised"), // hover / raised surfaces
        field: token("c-field"), //  pill inputs
        seg: token("c-seg"), //      selected segment
        line: token("c-line"),
        ink: token("c-ink"),
        mute: token("c-mute"),
        faint: token("c-faint"),
        pill: token("c-pill"), //    primary dark pill
        pillink: token("c-pillink"),
        accent: "rgb(var(--accent) / <alpha-value>)",
        accent2: "rgb(var(--accent2) / <alpha-value>)",
      },
      fontFamily: { sans: ["Manrope", "Inter", "system-ui", "-apple-system", "Segoe UI", "sans-serif"] },
      fontSize: { "2xs": ["11px", "15px"], xs: ["12px", "17px"], sm: ["13px", "18px"], base: ["14px", "20px"] },
      borderRadius: {
        sm: "6px", DEFAULT: "8px",
        md: "var(--r-in2)", lg: "var(--r-in2)", //  inside something, 20px from its edge
        xl: "var(--r-in)", "2xl": "var(--r-in)", //  inside a card, 12px from its edge
        "3xl": "var(--r)",
        card: "var(--r)", big: "var(--r-big)", inner: "var(--r-in)", inner2: "var(--r-in2)",
      },
      boxShadow: {
        card: "0 1px 2px rgb(var(--c-shadow) / 0.05), 0 10px 30px rgb(var(--c-shadow) / 0.10)",
        float: "0 2px 6px rgb(var(--c-shadow) / 0.08), 0 14px 40px rgb(var(--c-shadow) / 0.16)",
      },
    },
  },
  plugins: [],
} satisfies Config;
