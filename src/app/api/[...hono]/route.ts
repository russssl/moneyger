"use server"
import statsRouter from "@/server/api/routers/stats"
import { Hono } from "hono"
import { cors } from "hono/cors"
import { type NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { type AuthVariables } from "@/server/api/authenticate"
import userRouter from "@/server/api/routers/userRouter"
import walletsRouter from "@/server/api/routers/walletsRouter"
import transactionsRouter from "@/server/api/routers/transactionsRouter"

const api = new Hono<AuthVariables>();

// Configure CORS
api.use("*", cors({
  origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  exposeHeaders: ["Content-Length"],
  maxAge: 600,
  credentials: true,
}))

api.get("/api/healthcheck", (c) => {
  return c.json({ status: "ok" });
});

// Mount auth handler
api.on(["GET", "POST"], "/auth/*", (c) => {
  return auth.handler(c.req.raw);
});

api.route("/api/stats", statsRouter);
api.route("/api/user", userRouter);
api.route("/api/wallets", walletsRouter);
api.route("/api/transactions", transactionsRouter);

export async function GET(req: NextRequest) { return api.fetch(req) }
export async function POST(req: NextRequest) { return api.fetch(req) }
export async function PUT(req: NextRequest) { return api.fetch(req) }
export async function DELETE(req: NextRequest) { return api.fetch(req) }
export async function OPTIONS(req: NextRequest) { return api.fetch(req) }