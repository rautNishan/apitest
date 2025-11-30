import {
  BaseEntity,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Generated,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";

@Index(["id"], {
  where: `"deleted_at" IS NULL`,
})

export class DataBaseBaseEntity extends BaseEntity {
  @Generated("uuid")
  @PrimaryColumn({
    type: "uuid",
  })
  id: string;

  @CreateDateColumn({ type: "timestamptz", name: "created_at" })
  createdAt: Date;

  @DeleteDateColumn({ type: "timestamptz", name: "deleted_at" })
  deletedAt: Date | null;

  @UpdateDateColumn({ type: "timestamptz", name: "updated_at" })
  updatedAt: Date;
}