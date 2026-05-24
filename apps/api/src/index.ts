import { createServer } from "node:http";
import express from "express";
import cors from "cors";
import { env, corsOrigins } from "./env.js";
import { connectMongo } from "./lib/mongo.js";
import { initSocket } from "./ws/io.js";
import { healthRouter } from "./routes/health.js";
import { assignmentsRouter } from "./routes/assignments.js";
import { errorHandler } from "./middleware/error.js";

async function main() {
  await connectMongo();

  const app = express();
  app.use(cors({ origin: corsOrigins }));
  app.use(express.json({ limit: "1mb" }));

  app.use("/api", healthRouter);
  app.use("/api", assignmentsRouter);
  app.use(errorHandler);

  const httpServer = createServer(app);
  initSocket(httpServer);

  httpServer.listen(env.API_PORT, () => {
    console.log(`[api] listening on http://localhost:${env.API_PORT}`);
  });
}

main().catch((err) => {
  console.error("[api] fatal:", err);
  process.exit(1);
});
