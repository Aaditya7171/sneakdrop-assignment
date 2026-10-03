import { resolve } from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // "@/..." maps to "src/..." — used everywhere as a clean import alias
    alias: { "@": resolve(import.meta.dirname, "./src") },
  },
});