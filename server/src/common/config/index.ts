import "reflect-metadata";
import { dbConfig } from "./database.config";
import redisConfig from "./redis.config";

export const config = {
  database: dbConfig,
  redisConfig:redisConfig
};