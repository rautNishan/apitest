import { Column, Entity, Index, PrimaryColumn } from "typeorm";
import { DataBaseBaseEntity } from "../../../database/base/entity/base.entity";

export const OrderStatsDailyEntityName = "order_stats";

@Entity({ name: OrderStatsDailyEntityName })
@Index("date_idx_order_stats", ["date"])
export class OrderStatsEntity extends DataBaseBaseEntity {
  @Index({ unique: true })
  @Column({ type: "date" })
  date: string;

  @Column({ type: "int", name: "total_orders", default: 0 })
  totalOrders: number;

  @Column({
    type: "decimal",
    precision: 12,
    scale: 2,
    name: "total_revenue",
    default: 0,
  })
  totalRevenue: number;

  @Column({
    type: "decimal",
    precision: 12,
    scale: 2,
    name: "total_discount",
    default: 0,
  })
  totalDiscount: number;

  @Column({
    type: "decimal",
    precision: 12,
    scale: 2,
    name: "avg_order_value",
    default: 0,
  })
  avgOrderValue: number;

  @Column({ type: "int", name: "pending_count", default: 0 })
  pendingCount: number;

  @Column({ type: "int", name: "delivered_count", default: 0 })
  deliveredCount: number;

  @Column({ type: "int", name: "cancelled_count", default: 0 })
  cancelledCount: number;
}
