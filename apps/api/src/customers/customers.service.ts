import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, type Customer } from '@repo/database';
import {
  isPhoneLike,
  normalizePhone,
  phoneDuplicateKey,
  PHONE_INVALID_MESSAGE,
  PHONE_PATTERN,
} from '../common/utils/phone.util.js';
import {
  buildCsvFileName,
  MAX_CSV_EXPORT_ROWS,
  toCsv,
} from '../common/utils/csv.util.js';
import type { CsvExportResponse } from '../common/types/csv-export.types.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateCustomerDto } from './dto/create-customer.dto.js';
import { FindCustomerDuplicatesDto } from './dto/find-customer-duplicates.dto.js';
import { QueryCustomersDto } from './dto/query-customers.dto.js';
import { UpdateCustomerDto } from './dto/update-customer.dto.js';

export const DEFAULT_PAGE_SIZE = 20;

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedCustomers {
  data: Customer[];
  meta: PaginationMeta;
}

export interface CustomerDuplicateMatch {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  city: string | null;
  ordersCount: number;
  lastOrderAt: Date | null;
  createdAt: Date;
}

export interface CustomerDuplicateResponse {
  matches: CustomerDuplicateMatch[];
}

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCustomerDto): Promise<Customer> {
    return this.prisma.client.customer.create({
      data: {
        name: dto.name,
        phone: this.normalizePhone(dto.phone),
        phoneNormalized: phoneDuplicateKey(dto.phone),
        email: this.normalizeEmail(dto.email),
        address: dto.address ?? null,
        city: dto.city ?? null,
        postalCode: dto.postalCode ?? null,
        notes: dto.notes ?? null,
      },
    });
  }

  /**
   * Finds customers that already use the same phone number. The seller sees
   * these before creating a duplicate, but saving is still allowed because
   * two people in one household can legitimately share a number.
   */
  async findDuplicates(
    query: FindCustomerDuplicatesDto,
  ): Promise<CustomerDuplicateResponse> {
    const key = phoneDuplicateKey(query.phone);

    const matches = await this.prisma.client.customer.findMany({
      where: {
        ...(query.excludeId ? { id: { not: query.excludeId } } : {}),
        OR: [
          { phoneNormalized: key },
          { phoneNormalized: null, phone: query.phone },
        ],
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        city: true,
        createdAt: true,
        _count: { select: { orders: true } },
        orders: {
          select: { createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'asc' },
      take: 5,
    });

    return {
      matches: matches.map((match) => ({
        id: match.id,
        name: match.name,
        phone: match.phone,
        email: match.email,
        city: match.city,
        ordersCount: match._count.orders,
        lastOrderAt: match.orders[0]?.createdAt ?? null,
        createdAt: match.createdAt,
      })),
    };
  }

  async findAll(query: QueryCustomersDto): Promise<PaginatedCustomers> {
    const page = query.page ?? 1;
    const limit = query.limit ?? DEFAULT_PAGE_SIZE;
    const where = this.buildWhere(query);

    const [data, total] = await Promise.all([
      this.prisma.client.customer.findMany({
        where,
        orderBy: this.buildOrderBy(query),
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.client.customer.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async exportCsv(query: QueryCustomersDto): Promise<CsvExportResponse> {
    const where = this.buildWhere(query);
    const total = await this.prisma.client.customer.count({ where });

    if (total > MAX_CSV_EXPORT_ROWS) {
      throw new BadRequestException(
        `This export contains ${total.toLocaleString()} customers. Narrow the search to ${MAX_CSV_EXPORT_ROWS.toLocaleString()} customers or fewer.`,
      );
    }

    const customers = await this.prisma.client.customer.findMany({
      where,
      select: {
        name: true,
        phone: true,
        email: true,
        address: true,
        city: true,
        postalCode: true,
        notes: true,
        createdAt: true,
        _count: { select: { orders: true } },
        orders: {
          select: { createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: this.buildOrderBy(query),
      take: MAX_CSV_EXPORT_ROWS,
    });

    const rows: unknown[][] = [
      [
        'Name',
        'Phone',
        'Email',
        'Address',
        'City',
        'Postal code',
        'Notes',
        'Orders',
        'Last order',
        'Customer since',
      ],
    ];

    for (const customer of customers) {
      rows.push([
        customer.name,
        customer.phone,
        customer.email ?? '',
        customer.address ?? '',
        customer.city ?? '',
        customer.postalCode ?? '',
        customer.notes ?? '',
        customer._count.orders,
        customer.orders[0]?.createdAt.toISOString() ?? '',
        customer.createdAt.toISOString(),
      ]);
    }

    return {
      fileName: buildCsvFileName('customers'),
      content: toCsv(rows),
    };
  }

  private buildWhere(query: QueryCustomersDto): Prisma.CustomerWhereInput {
    const search = query.search || undefined;
    const conditions: Prisma.CustomerWhereInput[] = [];

    if (search) {
      const searchConditions: Prisma.CustomerWhereInput[] = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];

      if (isPhoneLike(search)) {
        const phoneTerm = normalizePhone(search);

        if (phoneTerm) {
          searchConditions.push({ phone: { contains: phoneTerm } });
        }
      }

      conditions.push({ OR: searchConditions });
    }

    return conditions.length > 0 ? { AND: conditions } : {};
  }

  async findOne(id: string): Promise<Customer> {
    const customer = await this.prisma.client.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return customer;
  }

  async update(id: string, dto: UpdateCustomerDto): Promise<Customer> {
    const existing = await this.prisma.client.customer.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Customer not found');
    }

    const data: Prisma.CustomerUpdateInput = {};

    if (dto.name !== undefined) {
      data.name = dto.name;
    }

    if (dto.phone !== undefined) {
      data.phone = this.normalizePhone(dto.phone);
      data.phoneNormalized = phoneDuplicateKey(dto.phone);
    }

    if (dto.email !== undefined) {
      data.email = this.normalizeEmail(dto.email);
    }

    if (dto.address !== undefined) {
      data.address = dto.address;
    }

    if (dto.city !== undefined) {
      data.city = dto.city;
    }

    if (dto.postalCode !== undefined) {
      data.postalCode = dto.postalCode;
    }

    if (dto.notes !== undefined) {
      data.notes = dto.notes;
    }

    if (Object.keys(data).length === 0) {
      return existing;
    }

    return this.prisma.client.customer.update({ where: { id }, data });
  }

  async remove(id: string): Promise<void> {
    const existing = await this.prisma.client.customer.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Customer not found');
    }

    try {
      await this.prisma.client.customer.delete({ where: { id } });
    } catch (error) {
      throw this.mapReferencedViolation(error);
    }
  }

  private buildOrderBy(
    query: QueryCustomersDto,
  ): Prisma.CustomerOrderByWithRelationInput {
    const field = query.sortBy ?? 'createdAt';
    const order = query.sortOrder ?? (field === 'name' ? 'asc' : 'desc');

    switch (field) {
      case 'name':
        return { name: order };
      case 'updatedAt':
        return { updatedAt: order };
      default:
        return { createdAt: order };
    }
  }

  private normalizePhone(raw: string): string {
    const phone = normalizePhone(raw);

    if (!PHONE_PATTERN.test(phone)) {
      throw new BadRequestException(PHONE_INVALID_MESSAGE);
    }

    return phone;
  }

  private normalizeEmail(email: string | null | undefined): string | null {
    return email ? email.trim().toLowerCase() : null;
  }

  private mapReferencedViolation(error: unknown): unknown {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === 'P2003' || error.code === 'P2014')
    ) {
      return new ConflictException(
        'Customer cannot be deleted because it is still referenced by other records',
      );
    }

    return error;
  }
}
