"use client";

import { io, type Socket } from "socket.io-client";
import { SOCKET_EVENTS, type ProgressEvent } from "@veda/shared";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

let socket: Socket | null = null;

function getSocket(): Socket {
  if (!socket) {
    socket = io(API_BASE, { transports: ["websocket"], autoConnect: true });
  }
  return socket;
}

/**
 * Join an assignment's room and receive progress events.
 * Returns an unsubscribe function.
 */
export function subscribeToAssignment(
  assignmentId: string,
  onProgress: (event: ProgressEvent) => void,
): () => void {
  const s = getSocket();

  const join = () => s.emit(SOCKET_EVENTS.SUBSCRIBE, assignmentId);
  join();
  // Re-join on reconnect so a dropped connection doesn't miss updates.
  s.on("connect", join);
  s.on(SOCKET_EVENTS.PROGRESS, onProgress);

  return () => {
    s.off(SOCKET_EVENTS.PROGRESS, onProgress);
    s.off("connect", join);
  };
}
