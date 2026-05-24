import { Queue, QueueEvents } from "bullmq";
import { redis } from "./redis.js";
import { GENERATION_QUEUE, PDF_QUEUE } from "../env.js";

export interface GenerationJobData {
  assignmentId: string;
}

export interface PdfJobData {
  assignmentId: string;
}

/** Producer side — the API enqueues generation jobs here. */
export const generationQueue = new Queue<GenerationJobData>(GENERATION_QUEUE, {
  connection: redis,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: 100,
    removeOnFail: 200,
  },
});

/**
 * QueueEvents lets the API observe job lifecycle (progress/completed/failed)
 * emitted by the worker, so it can push real-time updates to clients.
 */
export const generationQueueEvents = new QueueEvents(GENERATION_QUEUE, {
  connection: redis,
});

/** Producer side for PDF rendering jobs. */
export const pdfQueue = new Queue<PdfJobData>(PDF_QUEUE, {
  connection: redis,
  defaultJobOptions: { attempts: 1, removeOnComplete: 50, removeOnFail: 50 },
});

/** Lets the download route await a PDF job's completion. */
export const pdfQueueEvents = new QueueEvents(PDF_QUEUE, { connection: redis });
