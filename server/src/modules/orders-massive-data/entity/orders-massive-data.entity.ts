import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { DataBaseBaseEntity } from "../../../database/base/entity/base.entity";
import {
  IOrderEntity,
  IShippingAddress,
} from "../interfaces/order.entity.interface";
import { OrderStatus, PaymentStatus } from "../constants/enum/orders.enum";

//SELECT sum(pg_column_size(t.*)) as filesize, count(*) as filerow FROM orders as t;

export const OrderMassiveDataEntityName = "orders_massive_entity";
@Entity({
  name: OrderMassiveDataEntityName,
})
@Index("order_items_fts_tsv_idx", { synchronize: false })
@Index(["createdAt"], {
  where: `"deleted_at" IS NULL`,
})

//Assuming another table order_details exists for the data
export class OrdeMassiveEntity extends DataBaseBaseEntity implements IOrderEntity {
  // Relations (1:many with User and OrderItems - not implemented here)
  // @ManyToOne(() => User, (user) => user.orders)
  // @JoinColumn({ name: "user_id" })
  // user: User;

  // @OneToMany(() => OrderItem, (item) => item.order)
  // items: OrderItem[]; where we have {order_id, item_id and some details}

  // @Column({ type: "uuid", name: "shipping_address_id" })
  // @Index()
  // shippingAddressId: string;

  @Column({
    type: "uuid",
    name: "user_id",
    nullable: false,
  })
  @Index()
  userId: string;

  @Column({
    type: "enum",
    enum: OrderStatus,
    default: OrderStatus.PENDING,
    nullable: false,
  })
  status: OrderStatus;



  @Column({
    type: "tsvector",
    name: "order_items_tsv",
    nullable: true,
    select:false
  })
  orderItemsTsv: string;

  @Column({
    type: "varchar",
    name: "order_item_text",
    length:200,
    nullable: false,
    select:false
  })
  orderItemText: string;
}
