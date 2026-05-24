import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { QuestionPaper } from "@veda/shared";
import { env } from "../env.js";
import { paperHtml } from "./template.js";

export function pdfPathFor(assignmentId: string): string {
  return path.join(env.STORAGE_DIR, `${assignmentId}.pdf`);
}

/**
 * Render the paper to a properly typeset A4 PDF and persist it to disk.
 *
 * Puppeteer is imported lazily so the worker can start even on hosts where
 * Chromium is unavailable (e.g. some free tiers). If launch fails, the PDF job
 * rejects and the API returns a graceful 503 — the rest of the app is unaffected.
 */
export async function renderPaperPdf(
  assignmentId: string,
  paper: QuestionPaper,
): Promise<string> {
  await mkdir(env.STORAGE_DIR, { recursive: true });

  const { default: puppeteer } = await import("puppeteer");
  const browser = await puppeteer.launch({
    headless: true,
    // In Docker/production, point at the system-installed Chromium.
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(paperHtml(paper), { waitUntil: "domcontentloaded" });
    const buffer = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
    });
    const outPath = pdfPathFor(assignmentId);
    await writeFile(outPath, buffer);
    return outPath;
  } finally {
    await browser.close();
  }
}
