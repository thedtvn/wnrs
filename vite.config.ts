import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "node:path"
// NEED FOR DISCORD Activity IFrame to work in dev mode
import basicSsl from '@vitejs/plugin-basic-ssl'

const r = (p: string) => path.resolve(__dirname, p)

// Dev API/socket server port (Express). Override via PORT in .env if changed.
const API_PORT = process.env.PORT ?? 3000

export default defineConfig({
  plugins: [react(), basicSsl()],
  resolve: {
    alias: {
      "@src": r("./src"),
      "@": r("./src"),
      "@components": r("./src/components"),
      "@context": r("./src/context"),
      "@hooks": r("./src/hooks"),
      "@util": r("./src/util"),
      "@public": r("./public"),
    },
  },
  server: {
    allowedHosts: true,
    port: 3001,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
      "Access-Control-Allow-Headers": "X-Requested-With, content-type, Authorization",
    },
    proxy: {
      "/.proxy/api": {
        target: `http://localhost:${API_PORT}`,
        rewrite: (path) => path.replace(/^\/\.proxy/, ''),
      },
      "/.proxy/socket.io": {
        target: `http://localhost:${API_PORT}`,
        ws: true,
        rewrite: (path) => path.replace(/^\/\.proxy/, ''),
      },
      "/api": `http://localhost:${API_PORT}`,
      "/socket.io": {
        target: `http://localhost:${API_PORT}`,
        ws: true,
      },
    },
  },
})
