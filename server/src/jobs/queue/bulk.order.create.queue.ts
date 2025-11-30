import { Queue, Worker } from 'bullmq';
import { config } from '../../common/config';
import { processBulkOrderCreate } from '../processors/order.bulk.create.processort';

const connection = { 
  host: config.redisConfig.host, 
  port: config.redisConfig.port 
}; 

export const BULK_ORDER_CREATE_QUEUE_NAME = 'bulkOrderCreateQueue';

export const bulkOrderCreateQueue = new Queue(BULK_ORDER_CREATE_QUEUE_NAME, { 
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: 100,
    removeOnFail: 500,
  }
});

export const bulkOrderCreateWorker = new Worker(
  BULK_ORDER_CREATE_QUEUE_NAME,
  async (job) => {
    await processBulkOrderCreate(job);
  },
  { 
    connection,
    concurrency: 3,
  }
);

bulkOrderCreateWorker.on('failed', (job, err) => {
  console.error(`Bulk create job ${job?.id} failed:`, err);
});

bulkOrderCreateWorker.on('completed', (job) => {
  console.log(`Bulk create job ${job.id} completed successfully`);
});

bulkOrderCreateWorker.on('active', (job) => {
  console.log(`Processing bulk create job ${job.id} with ${job.data.orders.length} orders`);
});