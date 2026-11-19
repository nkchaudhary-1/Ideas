import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#181818",
        panel: "#222222",
        panel2: "#262626",
        raised: "#2d2d2d",
        line: "#363636",
        ink: "#ececec",
        mute: "#8f8f8f",
        faint: "#5e5e5e",
        accent: "rgb(var(--accent) / <alpha-value>)",
      },
      fontFamily: { sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "sans-serif"] },
      fontSize: { "2xs": ["10px", "14px"], xs: ["11px", "16px"], sm: ["12px", "17px"] },
    },
  },
  plugins: [],
} satisfies Config;
