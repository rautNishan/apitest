import "dotenv/config";
export default {
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT) || 5432,
  password:process.env.REDIS_PASS ?? null
};