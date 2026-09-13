import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL("./index.html", import.meta.url)),
        // Internal design-system reference only — not part of the real
        // site's navigation or bundle entry, kept as its own HTML page so
        // it can never be linked to or shipped as app UI.
        styleguide: fileURLToPath(
          new URL("./styleguide.html", import.meta.url),
        ),
      },
    },
  },
});
