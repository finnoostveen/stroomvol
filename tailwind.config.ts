import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        sv: {
          accent: "var(--sv-accent)",
          black: "var(--sv-black)",
          white: "var(--sv-white)",
          green: "var(--sv-green)",
          red: "var(--sv-red)",
          blue: "var(--sv-blue)",
        },
      },
      fontFamily: {
        heading: ["var(--sv-font-heading)"],
        body: ["var(--sv-font-body)"],
      },
      borderRadius: {
        sv: "var(--sv-radius)",
        "sv-sm": "var(--sv-radius-sm)",
        "sv-xs": "var(--sv-radius-xs)",
        "sv-pill": "var(--sv-radius-pill)",
      },
    },
  },
  plugins: [],
};

export default config;
