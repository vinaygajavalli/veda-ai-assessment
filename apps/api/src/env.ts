import path from "node:path";
import { config } from "dotenv";
import { z } from "zod";

// Load the monorepo-root .env so `npm run dev` works without manual exports.
config({ path: path.resolve(process.cwd(), "..", "..", ".env") });

const EnvSchema = z.object({
  MONGO_URI: z.string().default("mongodb://localhost:27017/veda"),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  API_PORT: z.coerce.number().default(4000),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  // Must resolve to the same location the worker writes PDFs to.
  STORAGE_DIR: z
    .string()
    .default(path.resolve(process.cwd(), "..", "..", ".data", "pdfs")),
});

export const env = EnvSchema.parse(process.env);

/** Queue names shared with the worker. Keep these identical. */
export const GENERATION_QUEUE = "assessment-generation";
export const PDF_QUEUE = "pdf-generation";

export const corsOrigins = env.CORS_ORIGIN.split(",").map((s) => s.trim());
