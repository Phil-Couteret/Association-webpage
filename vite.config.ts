import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { copyFileSync } from "fs";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    https: false,
    proxy: {
      // Proxy API requests to PHP backend
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  plugins: [
    react(),
    // Custom plugin to copy .htaccess files (hidden files aren't copied by default)
    {
      name: 'copy-htaccess',
      closeBundle() {
        // Copy .htaccess
        try {
          copyFileSync('public/.htaccess', 'dist/.htaccess');
          console.log('✓ .htaccess copied to dist/');
        } catch (err) {
          console.warn('⚠ .htaccess not found, skipping...');
        }
        
        // Copy .htaccess.minimal
        try {
          copyFileSync('public/.htaccess.minimal', 'dist/.htaccess.minimal');
          console.log('✓ .htaccess.minimal copied to dist/');
        } catch (err) {
          console.warn('⚠ .htaccess.minimal not found, skipping...');
        }
      }
    }
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "content": path.resolve(__dirname, "./content"),
    },
  },
}));
