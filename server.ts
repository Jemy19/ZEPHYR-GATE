// Express server setup for the full-stack application
// This file serves as the backend entry point, handling API routes and serving the Vite React app
import express from "express";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  // The port must be 3000 as per the environment constraints
  const PORT = 3000;

  // API routes FIRST
  // These routes handle backend logic (e.g., interacting with Jira, Zephyr, or Gemini APIs)
  // Currently, it just has a simple health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  // This allows the Express server to also serve the React frontend during development,
  // handling hot-reloading and asset serving seamlessly.
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa", // Single Page Application mode
    });
    // Use Vite's connect instance as middleware
    app.use(vite.middlewares);
  }

  // Start the server, listening on all network interfaces (0.0.0.0)
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// Initialize and start the server
startServer();
