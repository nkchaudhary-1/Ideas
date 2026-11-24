import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

// Colours are CSS variables holding "r g b" so one class works in dark and light and takes /opacity.
const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    borderRadius: {
      none: "0px",
      full: "9999px",
      sm: "4px", // glyphs under 24px
      DEFAULT: "8px", // the floor
      card: "var(--r)",
      big: "var(--r-big)",
      ...Object.fromEntries(Array.from({ length: 32 }, (_, i) => [`in-${i + 1}`, `max(calc(var(--r) - ${i + 1}px), 8px)`])),
      ...Object.fromEntries(Array.from({ length: 24 }, (_, i) => [`bin-${i + 1}`, `max(calc(var(--r-big) - ${i + 1}px), 8px)`])),
    },
    extend: {
      colors: {
        bg: token("c-bg"), //         page
        panel: token("c-panel"), //   cards
        panel2: token("c-panel2"), // quiet surfaces and fields inside cards
        raised: token("c-raised"), // hover
        line: token("c-line"),
        ink: token("c-ink"),
        mute: token("c-mute"),
        faint: token("c-faint"),
        accent: token("c-accent"), //     lime fill
        onaccent: token("c-onaccent"), // text on the lime fill
        accentfg: token("c-accentfg"), // lime used as text, icon or line
        blue: token("c-blue"), //         emphasis cues
        rec: token("c-rec"), //           recording
      },
      fontFamily: {
        sans: ['"Geist Variable"', "Geist", "Inter", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        mono: ['"Geist Mono Variable"', '"Geist Mono"', "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      // Every size and line height is a multiple of 4px.
      fontSize: {
        xs: ["12px", "16px"],
        sm: ["14px", "20px"],
        base: ["16px", "24px"],
        lg: ["18px", "28px"],
        xl: ["20px", "28px"],
        "2xl": ["24px", "32px"],
        "3xl": ["32px", "40px"],
        "4xl": ["44px", "48px"],
        "5xl": ["56px", "60px"],
        "6xl": ["72px", "76px"],
      },
      // One corner system (see /CLAUDE.md): cards 24px (32px from 1920px wide), dialogs and sheets 32px, capsules for
      // controls. Nested corners are concentric: parent radius minus the gap, never below 8px.
      boxShadow: {
        pop: "0 2px 6px rgb(0 0 0 / 0.18), 0 18px 48px rgb(0 0 0 / 0.32)",
      },
      keyframes: {
        rise: { from: { opacity: "0", transform: "translateY(8px)" }, to: { opacity: "1", transform: "none" } },
        fade: { from: { opacity: "0" }, to: { opacity: "1" } },
        slideup: { from: { transform: "translateY(100%)" }, to: { transform: "none" } },
        pulse2: { "0%,100%": { opacity: "1" }, "50%": { opacity: "0.35" } },
      },
      animation: {
        rise: "rise 240ms cubic-bezier(.2,.7,.2,1) backwards",
        fade: "fade 180ms ease-out backwards",
        slideup: "slideup 280ms cubic-bezier(.2,.8,.2,1) backwards",
        pulse2: "pulse2 1.2s ease-in-out infinite",
      },
    },
  },
  plugins: [
    // `touch:` = no hover (phones, tablets); `coarse:` = the main pointer is a finger.
    plugin(({ addVariant }) => {
      addVariant("touch", "@media (hover: none)");
      addVariant("coarse", "@media (pointer: coarse)");
    }),
  ],
} satisfies Config;
