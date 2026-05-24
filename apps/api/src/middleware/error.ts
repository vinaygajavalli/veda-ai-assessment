import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

/** Wrap async route handlers so thrown errors reach the error middleware. */
export function asyncHandler<T extends Request>(
  fn: (req: T, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req as T, res, next).catch(next);
  };
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: "ValidationError",
      issues: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    });
    return;
  }
  const message = err instanceof Error ? err.message : "Internal Server Error";
  console.error("[api] error:", message);
  res.status(500).json({ error: "InternalServerError", message });
}
