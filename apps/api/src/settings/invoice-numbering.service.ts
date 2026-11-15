import { BadRequestException, Injectable } from '@nestjs/common';
import type { Prisma } from '@repo/database';
import { PrismaService } from '../prisma/prisma.service.js';
import { DOCUMENT_SEQUENCE_INVOICE_KEY } from './settings.constants.js';
import { SettingsService } from './settings.service.js';
import type { InvoiceNumberAssignment } from './settings.types.js';
import { formatInvoiceNumber } from './settings.utils.js';

@Injectable()
export class InvoiceNumberingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
  ) {}

  async previewNext(): Promise<InvoiceNumberAssignment> {
    const config = await this.settings.getInvoiceNumberingConfig();
    const year = config.yearBasedNumbering ? new Date().getUTCFullYear() : 0;
    const sequence = await this.prisma.client.documentSequence.findUnique({
      where: {
        key_year: {
          key: DOCUMENT_SEQUENCE_INVOICE_KEY,
          year,
        },
      },
    });

    const nextSequence = Math.max(
      sequence?.nextValue ?? config.startingSequence,
      config.startingSequence,
    );

    return {
      number: formatInvoiceNumber(config, nextSequence),
      sequence: nextSequence,
      year: config.yearBasedNumbering ? year : null,
    };
  }

  /**
   * Allocates the next invoice sequence atomically. The invoice module should
   * call this inside its own transaction and persist the returned number in the
   * same transaction so the sequence and the invoice stay in sync.
   */
  async claimNext(
    tx?: Prisma.TransactionClient,
  ): Promise<InvoiceNumberAssignment> {
    const config = await this.settings.getInvoiceNumberingConfig();

    if (!config.automaticNumbering) {
      throw new BadRequestException('Automatic invoice numbering is disabled');
    }

    const run = async (
      client: Prisma.TransactionClient,
    ): Promise<InvoiceNumberAssignment> => {
      const year = config.yearBasedNumbering ? new Date().getUTCFullYear() : 0;
      const sequence = await client.documentSequence.upsert({
        where: {
          key_year: {
            key: DOCUMENT_SEQUENCE_INVOICE_KEY,
            year,
          },
        },
        create: {
          key: DOCUMENT_SEQUENCE_INVOICE_KEY,
          year,
          nextValue: config.startingSequence + 1,
        },
        update: { nextValue: { increment: 1 } },
      });

      const issuedSequence = sequence.nextValue - 1;

      return {
        number: formatInvoiceNumber(config, issuedSequence),
        sequence: issuedSequence,
        year: config.yearBasedNumbering ? year : null,
      };
    };

    return tx ? run(tx) : this.prisma.client.$transaction(run);
  }
}
