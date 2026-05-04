import pino from "pino";

const isProduction = process.env.NODE_ENV === "production";
const isServerless = !!process.env.NETLIFY || !!process.env.LAMBDA_TASK_ROOT;

const baseOptions = {
  level: process.env.LOG_LEVEL ?? "info",
  redact: [
    "req.headers.authorization",
    "req.headers.cookie",
    "res.headers['set-cookie']",
  ],
};

export const logger = isServerless
  // Serverless (Netlify/Lambda): use synchronous stdout — no worker threads,
  // no transports. This avoids "Cannot find module thread-stream-worker.js"
  // errors caused by pino's default async worker thread setup.
  ? pino(baseOptions, pino.destination({ sync: true }))
  : isProduction
  ? pino(baseOptions)
  : pino({
      ...baseOptions,
      transport: { target: "pino-pretty", options: { colorize: true } },
    });
