import { Worker } from "bullmq";
import { env, GENERATION_QUEUE, PDF_QUEUE } from "./env.js";
import { redis } from "./lib/redis.js";
import { connectMongo } from "./lib/mongo.js";
import { processGeneration } from "./processors/generation.js";
import { processPdf } from "./processors/pdf.js";

async function main() {
  await connectMongo();

  const generationWorker = new Worker(GENERATION_QUEUE, processGeneration, {
    connection: redis,
    concurrency: 4,
  });

  const pdfWorker = new Worker(PDF_QUEUE, processPdf, {
    connection: redis,
    concurrency: 2,
  });

  for (const [name, w] of [
    ["generation", generationWorker],
    ["pdf", pdfWorker],
  ] as const) {
    w.on("completed", (job) => console.log(`[worker:${name}] completed ${job.id}`));
    w.on("failed", (job, err) =>
      console.error(`[worker:${name}] failed ${job?.id}: ${err.message}`),
    );
  }

  console.log(`[worker] ready (model: ${env.GEMINI_MODEL})`);

  const shutdown = async () => {
    await Promise.all([generationWorker.close(), pdfWorker.close()]);
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error("[worker] fatal:", err);
  process.exit(1);
});
