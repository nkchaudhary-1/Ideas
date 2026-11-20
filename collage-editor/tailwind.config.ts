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
      // One corner system (see /CLAUDE.md). Cards are --r (24px, 32px on very large screens); the stage and dialogs are
      // always 32px. Anything nested is concentric: its radius is the parent's minus the gap between the two edges,
      // never below 8px. `in-N` is "N px in from a card's edge"; `bin-N` is "N px in from a 32px surface (dialog, stage)".
      // Add the gaps up when nesting: a control 16px inside a section that sits 12px inside a card is `in-28`.
      borderRadius: {
        none: "0px", full: "9999px",
        sm: "4px", //  glyphs under 24px (ticks, tiny icons)
        DEFAULT: "8px", //  the floor: leaf controls and thumbnails deep inside a card
        card: "var(--r)", big: "var(--r-big)",
        ...Object.fromEntries(Array.from({ length: 32 }, (_, i) => [`in-${i + 1}`, `max(calc(var(--r) - ${i + 1}px), 8px)`])),
        ...Object.fromEntries(Array.from({ length: 24 }, (_, i) => [`bin-${i + 1}`, `max(calc(var(--r-big) - ${i + 1}px), 8px)`])),
      },
      boxShadow: {
        card: "0 1px 2px rgb(var(--c-shadow) / 0.05), 0 10px 30px rgb(var(--c-shadow) / 0.10)",
        float: "0 2px 6px rgb(var(--c-shadow) / 0.08), 0 14px 40px rgb(var(--c-shadow) / 0.16)",
      },
    },
  },
  plugins: [],
} satisfies Config;
