import { Queue, Worker } from 'bullmq';
import { config } from '../../common/config';
import { updateBulkOrderStats } from '../processors/orders.bulk.stats.processor';

const connection = { 
  host: config.redisConfig.host, 
  port: config.redisConfig.port 
}; 

export const BULK_ORDER_STATS_QUEUE_NAME = 'bulkOrderStatsQueue';

export const bulkOrderStatsQueue = new Queue(BULK_ORDER_STATS_QUEUE_NAME, { 
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 3000,
    },
    removeOnComplete: 50,
    removeOnFail: 200,
  }
});

export const bulkOrderStatsWorker = new Worker(
  BULK_ORDER_STATS_QUEUE_NAME,
  async (job) => {
    await updateBulkOrderStats(job);
  },
  { 
    connection,
    concurrency: 5,
  }
);

bulkOrderStatsWorker.on('failed', (job, err) => {
  console.error(`Bulk stats job ${job?.id} failed:`, err);
});

bulkOrderStatsWorker.on('completed', (job) => {
  console.log(`Bulk stats job ${job.id} completed`);
});