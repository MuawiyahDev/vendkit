import { IsEnum } from 'class-validator';
import { OrderPaymentStatus } from '@repo/database';

export class UpdateOrderPaymentStatusDto {
  @IsEnum(OrderPaymentStatus)
  status!: OrderPaymentStatus;
}
