import { Injectable } from '@nestjs/common';
import { Prisma, type OrderEventType } from '@repo/database';
import type { TransactionClient } from './orders.types.js';

export interface OrderEventActor {
  id: string;
  name: string | null;
  email: string;
}

export interface RecordOrderEventInput {
  orderId: string;
  type: OrderEventType;
  message: string;
  metadata?: Prisma.InputJsonValue;
  actor?: OrderEventActor | null;
}

/**
 * Writes the human-readable order timeline. Events are always written inside
 * the same transaction as the change they describe, so history can never
 * disagree with the order it belongs to.
 */
@Injectable()
export class OrderEventsService {
  async record(
    tx: TransactionClient,
    input: RecordOrderEventInput,
  ): Promise<void> {
    await tx.orderEvent.create({
      data: {
        orderId: input.orderId,
        type: input.type,
        message: input.message,
        metadata: input.metadata,
        actorId: input.actor?.id ?? null,
        actorName: resolveActorName(input.actor),
      },
    });
  }
}

export function resolveActorName(
  actor: OrderEventActor | null | undefined,
): string | null {
  if (!actor) {
    return null;
  }

  return actor.name?.trim() || actor.email;
}
