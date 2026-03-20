import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0f172a",
        brandSlate: "#475569",
        panel: "#f8fafc",
        sky: "#0ea5e9",
        line: "#dbe3ec"
      }
    }
  },
  plugins: []
};

export default config;
