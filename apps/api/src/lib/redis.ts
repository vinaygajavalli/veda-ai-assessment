import { Redis } from "ioredis";
import { env } from "../env.js";

/**
 * BullMQ requires `maxRetriesPerRequest: null` on the connection it uses for
 * blocking commands. We share one client for the queue and queue-events.
 */
export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

redis.on("error", (err) => console.error("[api] redis error", err.message));
