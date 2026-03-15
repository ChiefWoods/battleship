import { defineConfig } from "vite";

const basePath = process.env.VITE_BASE_PATH ?? "/";

export default defineConfig({
  // Local builds/preview default to '/', GitHub Pages build overrides via VITE_BASE_PATH.
  base: basePath,
});
