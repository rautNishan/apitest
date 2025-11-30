import { DataSource } from "typeorm";
import { config } from "../common/config";
import path from "path";

export const dataSource: DataSource = new DataSource({
  type: "postgres",
  host: config.database.host || "postgres",
  port: Number(config.database.port) || 5432,
  username: config.database.username,
  password: config.database.password,
  database: config.database.database,
  logging: config.database.logger === "true",
  entities: [path.join(__dirname, "../**/*.entity.{js,ts}")],
  migrations: [path.join(__dirname, "migrations/*.{js,ts}")],
  synchronize: false,
  dropSchema: false,
});
