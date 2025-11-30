import { Job } from "bullmq";
import { dataSource } from "../../database/app.data-source";
import { OrderEntity } from "../../modules/orders/entity/orders.entity";
import { OrdersCreateDto } from "../../modules/orders/dtos/orders.create.dto";
import { bulkOrderStatsQueue } from "../queue/bulk.stats.queue";
import { OrderStatus, PaymentStatus } from "../../modules/orders/constants/enum/orders.enum";

interface BulkOrderCreateJobData {
  orders: OrdersCreateDto[];
}

export async function processBulkOrderCreate(
  job: Job<BulkOrderCreateJobData>
): Promise<void> {
  const { orders } = job.data;
  
  console.log(`Starting bulk create for ${orders.length} orders`);
  await dataSource.initialize()
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // SOLUTION 2: Use Repository save (Alternative)
    const orderRepository = queryRunner.manager.getRepository(OrderEntity);
    const orderEntities = orders.map(order => orderRepository.create({
      userId: order.userId,
      status: order.status || OrderStatus.PENDING,
      subtotal: order.subtotal,
      totalAmount: order.totalAmount,
      discountAmount: order.discountAmount || 0,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus || PaymentStatus.PENDING,
      orderItemText: order.orderItemText,
      deliveredAt: order.deliveredAt,
    }));
    const result = await orderRepository.save(orderEntities);


    await queryRunner.commitTransaction();

    // Extract order IDs from the result
    const orderIds = result.map((order: any) => order.id);


    // Queue stats update job
    await bulkOrderStatsQueue.add("bulk-order-stats-update", {
      orderIds,
    });


    console.log(`Successfully bulk created ${orderIds.length} orders`);
  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error(' Bulk create failed:', error);
    throw error;
  } finally {
    await queryRunner.release();
  }
}
