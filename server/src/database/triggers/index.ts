import { dataSource } from "../app.data-source";
import { addOrdersTsvectorTrigger } from "./tsv.trigger";

async function runTrigger() {
  try {
    await dataSource.initialize();
    console.log("Database connected");

    const queryRunner = dataSource.createQueryRunner();

    await addOrdersTsvectorTrigger(queryRunner);
    console.log("Trigger executed successfully");

    // Release the QueryRunner
    await queryRunner.release();
    await dataSource.destroy();
  } catch (error) {
    console.error("Error running trigger:", error);
    process.exit(1);
  }
}

runTrigger();
