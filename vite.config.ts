import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';
import path from "path";

export default defineConfig({
  base: '/Portail-variables-somnum.fr/',
  plugins: [
    tailwindcss(),
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    __ROUTE_MESSAGING_ENABLED__: JSON.stringify(false),
  },
});
