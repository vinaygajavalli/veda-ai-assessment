import type { Server as HttpServer } from "node:http";
import { Server as IOServer } from "socket.io";
import {
  SOCKET_EVENTS,
  assignmentRoom,
  type ProgressEvent,
} from "@veda/shared";
import { generationQueueEvents } from "../lib/queue.js";
import { corsOrigins } from "../env.js";

let io: IOServer | null = null;

export function getIo(): IOServer {
  if (!io) throw new Error("Socket.IO not initialised");
  return io;
}

/** Emit a progress event to everyone watching a specific assignment. */
export function emitProgress(event: ProgressEvent): void {
  getIo().to(assignmentRoom(event.assignmentId)).emit(SOCKET_EVENTS.PROGRESS, event);
}

export function initSocket(httpServer: HttpServer): void {
  io = new IOServer(httpServer, {
    cors: { origin: corsOrigins, methods: ["GET", "POST"] },
  });

  io.on("connection", (socket) => {
    socket.on(SOCKET_EVENTS.SUBSCRIBE, (assignmentId: unknown) => {
      if (typeof assignmentId === "string" && assignmentId) {
        socket.join(assignmentRoom(assignmentId));
      }
    });
  });

  // Bridge worker job lifecycle -> websocket rooms.
  // We use assignmentId as the BullMQ jobId, so jobId === assignmentId.
  generationQueueEvents.on("progress", ({ jobId, data }) => {
    // `data` is the ProgressEvent the worker passed to job.updateProgress().
    const event = data as ProgressEvent;
    if (event && typeof event === "object") {
      emitProgress({ ...event, assignmentId: jobId });
    }
  });

  generationQueueEvents.on("completed", ({ jobId }) => {
    emitProgress({
      assignmentId: jobId,
      status: "completed",
      progress: 100,
      message: "Question paper ready",
    });
  });

  generationQueueEvents.on("failed", ({ jobId, failedReason }) => {
    emitProgress({
      assignmentId: jobId,
      status: "failed",
      progress: 100,
      message: "Generation failed",
      error: failedReason,
    });
  });

  console.log("[api] Socket.IO ready");
}
