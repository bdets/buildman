import { defineConfig } from "vite";
import { resolve } from "path";

// Multiple real HTML pages (not a single-page app) — same pattern as the
// previous plain version, just now built/bundled by Vite so `import.meta.env`
// and npm packages work.
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        admin: resolve(__dirname, "admin.html"),
        member: resolve(__dirname, "member.html"),
      },
    },
  },
  server: {
    port: 5173,
  },
});
