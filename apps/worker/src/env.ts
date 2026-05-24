import path from "node:path";
import { config } from "dotenv";
import { z } from "zod";

// Load the monorepo-root .env so `npm run dev` works without manual exports.
config({ path: path.resolve(process.cwd(), "..", "..", ".env") });

const EnvSchema = z.object({
  MONGO_URI: z.string().default("mongodb://localhost:27017/veda"),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  ANTHROPIC_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().min(1, "GEMINI_API_KEY is required"),
  GEMINI_MODEL: z.string().default("gemini-2.5-flash"),
  GENERATION_CACHE_TTL: z.coerce.number().default(86_400),
  // Resolves to <repo-root>/.data/pdfs for both api and worker (both run one
  // level deep under apps/*). Override for shared storage in production.
  STORAGE_DIR: z
    .string()
    .default(path.resolve(process.cwd(), "..", "..", ".data", "pdfs")),
});

export const env = EnvSchema.parse(process.env);

/** Must match the API's queue names exactly. */
export const GENERATION_QUEUE = "assessment-generation";
export const PDF_QUEUE = "pdf-generation";
