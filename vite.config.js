import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";

// Prevent dev server crashes from unhandled promise rejections (like proxy timeouts)
process.on("unhandledRejection", (reason, promise) => {
  console.error("[Server] Unhandled Rejection at:", promise, "reason:", reason);
});

// Custom plugin to handle Vercel-style API routes locally in Vite
const localApiPlugin = () => ({
  name: "local-api",
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      // Handle /api requests
      const url = new URL(req.url, `http://${req.headers.host}`);
      if (url.pathname === "/api/ping") {
        res.end("pong");
        return;
      }

      if (url.pathname.startsWith("/api/")) {
        const apiPath = url.pathname.slice(5); // Remove '/api/'
        const possibleFiles = [
          path.join(process.cwd(), "api", `${apiPath}.js`),
          path.join(process.cwd(), "api", apiPath, "index.js"),
        ];

        const filePath = possibleFiles.find((f) => fs.existsSync(f));

        if (filePath) {
          try {
            // Read body for POST requests
            if (req.method === "POST") {
              req.body = await new Promise((resolve, reject) => {
                let body = "";
                req.on("data", (chunk) => {
                  body += chunk.toString();
                });
                req.on("end", () => {
                  if (!body) return resolve({});
                  try {
                    resolve(JSON.parse(body));
                  } catch (e) {
                    resolve(body);
                  }
                });
                req.on("error", reject);
              });
            }

            // Mock Vercel response object
            res.status = (code) => {
              res.statusCode = code;
              return res;
            };

            const originalSetHeader = res.setHeader.bind(res);
            res.setHeader = (name, value) => {
              originalSetHeader(name, value);
              return res;
            };

            res.json = (data) => {
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify(data));
              return res;
            };

            res.send = (data) => {
              res.end(data);
              return res;
            };

            // Mock Vercel request object
            req.query = Object.fromEntries(url.searchParams.entries());

            // Use dynamic import for the handler
            // Use ?t= for cache busting during dev
            const importPath = `file://${filePath}?t=${Date.now()}`;
            const { default: handler } = await import(importPath);

            if (typeof handler === "function") {
              await handler(req, res);
              return;
            } else {
              throw new Error("Handler is not a function");
            }
          } catch (error) {
            console.error("API Handler Error:", error);
            res.status(500).json({
              error: "Internal Server Error",
              message: error.message,
              stack: error.stack,
            });
            return;
          }
        }
      }
      next();
    });
  },
});

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), localApiPlugin()],
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-firebase": [
            "firebase/app",
            "firebase/auth",
            "firebase/firestore",
          ],
          "vendor-charts": ["chart.js", "react-chartjs-2"],
          "vendor-utils": [
            "jspdf",
            "jspdf-autotable",
            "html2canvas",
            "canvas-confetti",
          ],
          "vendor-ui": ["react-icons", "react-window", "@monaco-editor/react"],
        },
      },
    },
  },
});
