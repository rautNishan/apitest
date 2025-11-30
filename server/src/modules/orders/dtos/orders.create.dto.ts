
import {  IsDecimal, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
import { OrderStatus, PaymentStatus } from "../constants/enum/orders.enum";
export class OrdersCreateDto {
  @IsString()
  userId: string;

  @IsEnum(OrderStatus)
  @IsOptional()
  status?: OrderStatus;

  @IsDecimal()
  subtotal: number;

  @IsDecimal()
  totalAmount: number;

  @IsDecimal()
  @IsOptional()
  discountAmount?: number;

  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @IsEnum(PaymentStatus)
  @IsOptional()
  paymentStatus?: PaymentStatus;

  @IsString()
  @IsNotEmpty()
  orderItemText:string

  @IsOptional()
  deliveredAt?: Date | null;
}