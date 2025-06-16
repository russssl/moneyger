import { createClient } from "redis";
import { env } from "@/env";

const client = createClient({
  url: env.REDIS_URL,
});

client.on("error", (err) => {
  console.error("Redis Client Error", err);
});

let isConnected = false;

export async function redis() {
  if (!isConnected) {
    await client.connect();
    isConnected = true;
  }
  return client;
}
