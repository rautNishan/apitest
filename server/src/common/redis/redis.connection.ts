
import Redis from "ioredis";
import redisConfig from "../config/redis.config";

let redisClient: Redis | null = null;

export const connectRedis = async () => {
  redisClient = new Redis({
    host: redisConfig.host,
    port: redisConfig.port,
    password: redisConfig.password ?? undefined, 
  });

  return new Promise<Redis>((resolve, reject) => {
    redisClient!.on("connect", () => {
      console.log("Redis connected");
      resolve(redisClient!);
    });

    redisClient!.on("error", (err) => {
      console.error("Redis error:", err);
      reject(err);
    });
  });
};

export const getRedisClient = async () => {
  if (!redisClient) {
    redisClient = await connectRedis();
  }
  return redisClient;
};