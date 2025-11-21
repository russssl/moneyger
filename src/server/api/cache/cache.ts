import { createClient, type RedisClientType } from "redis";
import { env } from "@/env";

const client = createClient({
  url: env.REDIS_URL,
});

client.on("error", (err) => {
  console.error("Redis Client Error", err);
});

let connectionPromise: Promise<RedisClientType> | null = null;

export async function redis(): Promise<RedisClientType> {
  if (client.isOpen) {
    return client as RedisClientType;
  }

  if (!connectionPromise) {
    connectionPromise = (async () => {
      await client.connect();
      return client as RedisClientType;
    })();
  }

  return connectionPromise;
}
