import { Queue, Worker } from 'bullmq';
import { updateOrderStats } from '../processors/orders.single-stats.processor';
import { config } from '../../common/config';

const connection = { host: config.redisConfig.host, port:config.redisConfig.port }; 
export const ORDER_STATS_QUEUE_NAME = 'orderStatsQueue';

export const orderStatsQueue = new Queue(ORDER_STATS_QUEUE_NAME, { connection });

export const orderStatsWorker = new Worker(
  ORDER_STATS_QUEUE_NAME,
  async (job) => {
    await updateOrderStats(job);
  },
  { connection }
);

orderStatsWorker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed with error:`, err);
});



