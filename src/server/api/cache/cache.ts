import { createClient, type RedisClientType } from "redis";
import { env } from "@/env";

let client: RedisClientType | null = null;
let isConnecting = false;
let connectionPromise: Promise<RedisClientType> | null = null;

async function createRedisClient(): Promise<RedisClientType> {
  if (client && client.isOpen) {
    return client;
  }

  if (isConnecting && connectionPromise) {
    return connectionPromise;
  }

  isConnecting = true;
  connectionPromise = (async () => {
    try {
      const newClient = createClient({
        url: env.REDIS_URL,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              console.error("Redis: Max reconnection attempts reached");
              return new Error("Max reconnection attempts reached");
            }
            return Math.min(retries * 100, 3000);
          },
        },
      });

      newClient.on("error", (err) => {
        console.error("Redis Client Error", err);
      });

      newClient.on("connect", () => {
        console.log("Redis: Connected");
      });

      newClient.on("reconnecting", () => {
        console.log("Redis: Reconnecting...");
      });

      newClient.on("ready", () => {
        console.log("Redis: Ready");
      });

      await newClient.connect();
      client = newClient;
      isConnecting = false;
      return newClient;
    } catch (error) {
      isConnecting = false;
      connectionPromise = null;
      throw error;
    }
  })();

  return connectionPromise;
}

export async function redis(): Promise<RedisClientType> {
  try {
    return await createRedisClient();
  } catch (error) {
    console.error("Failed to get Redis client:", error);
    throw error;
  }
}

export function isRedisAvailable(): boolean {
  return client !== null && client.isOpen;
}
