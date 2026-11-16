import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { type Image, Prisma } from '@repo/database';
import {
  detectImageMimeType,
  readImageDimensions,
  type SupportedImageMimeType,
} from '../common/utils/image-signature.util.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  IMAGE_STORAGE,
  type ImageStorage,
  StorageFileNotFoundError,
} from '../storage/image-storage.js';
import type { CreateImageDto } from './dto/create-image.dto.js';
import type { QueryImagesDto } from './dto/query-images.dto.js';
import { IMAGE_MAX_FILE_SIZE } from './images.constants.js';

export const DEFAULT_PAGE_SIZE = 20;

/** Window used for the "recent uploads" statistic. */
export const RECENT_UPLOAD_WINDOW_DAYS = 30;

const IMAGE_API_ROUTE = '/api/images';

const MAX_STORED_ORIGINAL_NAME_LENGTH = 255;

const IMAGE_USAGE_INCLUDE = {
  _count: { select: { products: true } },
  businessProfileLogo: { select: { id: true } },
  invoiceLogo: { select: { id: true } },
} satisfies Prisma.ImageInclude;

type ImageWithUsage = Prisma.ImageGetPayload<{
  include: typeof IMAGE_USAGE_INCLUDE;
}>;

const EMPTY_IMAGE_USAGE: ImageUsageResponse = {
  total: 0,
  productCount: 0,
  businessProfileLogo: false,
  invoiceLogo: false,
};

const MIME_TYPE_EXTENSIONS: Record<SupportedImageMimeType, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

export interface UploadedImageFile {
  originalname: string;
  buffer: Buffer;
}

export interface ImageUsageResponse {
  /** Total number of records referencing this image. */
  total: number;
  productCount: number;
  businessProfileLogo: boolean;
  invoiceLogo: boolean;
}

export interface ImageResponse {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  altText: string | null;
  url: string;
  usage: ImageUsageResponse;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedImages {
  data: ImageResponse[];
  meta: PaginationMeta;
}

export interface ImageTypeUsageResponse {
  mimeType: string;
  count: number;
  size: number;
}

export interface ImageLibraryStatsResponse {
  totalImages: number;
  storageBytes: number;
  recentUploads: number;
  recentWindowDays: number;
  byType: ImageTypeUsageResponse[];
}

export interface StoredImageFile {
  mimeType: string;
  data: Buffer;
  size: number;
}

export function sanitizeOriginalName(originalName: string | undefined): string {
  const baseName = (originalName ?? '').split(/[\\/]/).pop() ?? '';
  const sanitized = baseName
    // oxlint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .trim();

  if (!sanitized) {
    return 'image';
  }

  return sanitized.slice(0, MAX_STORED_ORIGINAL_NAME_LENGTH);
}

@Injectable()
export class ImagesService {
  private readonly logger = new Logger(ImagesService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(IMAGE_STORAGE) private readonly storage: ImageStorage,
    @Inject(IMAGE_MAX_FILE_SIZE) private readonly maxFileSize: number,
  ) {}

  async create(
    file: UploadedImageFile | undefined,
    dto: CreateImageDto,
  ): Promise<ImageResponse> {
    const buffer = file?.buffer;

    if (!buffer || buffer.length === 0) {
      throw new BadRequestException('Image file is required');
    }

    if (buffer.length > this.maxFileSize) {
      throw new PayloadTooLargeException(
        `Image file exceeds the maximum allowed size of ${this.maxFileSize} bytes`,
      );
    }

    const mimeType = detectImageMimeType(buffer);

    if (!mimeType) {
      throw new BadRequestException(
        'Unsupported image format. Allowed formats: JPEG, PNG, WebP, GIF',
      );
    }

    const dimensions = readImageDimensions(buffer, mimeType);
    const storageKey = `${randomUUID()}.${MIME_TYPE_EXTENSIONS[mimeType]}`;
    const originalName = sanitizeOriginalName(file?.originalname);

    try {
      await this.storage.save(storageKey, buffer);
    } catch (error) {
      this.logger.error(
        `Failed to store image file "${storageKey}"`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new InternalServerErrorException(
        'Failed to store the uploaded image',
      );
    }

    try {
      const image = await this.prisma.client.image.create({
        data: {
          originalName,
          storageKey,
          mimeType,
          size: buffer.length,
          width: dimensions?.width ?? null,
          height: dimensions?.height ?? null,
          altText: dto.altText ?? null,
        },
      });

      return this.toResponse(image);
    } catch (error) {
      await this.cleanupStoredFile(storageKey);
      this.logger.error(
        `Failed to save image metadata for "${storageKey}"`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new InternalServerErrorException(
        'Failed to save the uploaded image',
      );
    }
  }

  async findAll(query: QueryImagesDto): Promise<PaginatedImages> {
    const page = query.page ?? 1;
    const limit = query.limit ?? DEFAULT_PAGE_SIZE;
    const search = query.search || undefined;

    const where: Prisma.ImageWhereInput = {
      ...(search
        ? {
            originalName: {
              contains: search,
              mode: 'insensitive',
            },
          }
        : {}),
      ...(query.mimeType ? { mimeType: query.mimeType } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.client.image.findMany({
        where,
        include: IMAGE_USAGE_INCLUDE,
        orderBy: this.buildOrderBy(query),
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.client.image.count({ where }),
    ]);

    return {
      data: data.map((image) => this.toResponse(image, this.toUsage(image))),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getStats(): Promise<ImageLibraryStatsResponse> {
    const recentSince = new Date(
      Date.now() - RECENT_UPLOAD_WINDOW_DAYS * 24 * 60 * 60 * 1000,
    );

    const [totalImages, storage, recentUploads, typeGroups] = await Promise.all(
      [
        this.prisma.client.image.count(),
        this.prisma.client.image.aggregate({ _sum: { size: true } }),
        this.prisma.client.image.count({
          where: { createdAt: { gte: recentSince } },
        }),
        this.prisma.client.image.groupBy({
          by: ['mimeType'],
          _count: { _all: true },
          _sum: { size: true },
        }),
      ],
    );

    const byType = typeGroups
      .map((group) => ({
        mimeType: group.mimeType,
        count: group._count._all,
        size: group._sum.size ?? 0,
      }))
      .sort(
        (left, right) =>
          right.count - left.count ||
          left.mimeType.localeCompare(right.mimeType),
      );

    return {
      totalImages,
      storageBytes: storage._sum.size ?? 0,
      recentUploads,
      recentWindowDays: RECENT_UPLOAD_WINDOW_DAYS,
      byType,
    };
  }

  async findOne(id: string): Promise<ImageResponse> {
    const image = await this.prisma.client.image.findUnique({
      where: { id },
      include: IMAGE_USAGE_INCLUDE,
    });

    if (!image) {
      throw new NotFoundException('Image not found');
    }

    return this.toResponse(image, this.toUsage(image));
  }

  async getFile(id: string): Promise<StoredImageFile> {
    const image = await this.prisma.client.image.findUnique({
      where: { id },
    });

    if (!image) {
      throw new NotFoundException('Image not found');
    }

    try {
      const data = await this.storage.read(image.storageKey);
      return { mimeType: image.mimeType, data, size: data.length };
    } catch (error) {
      if (error instanceof StorageFileNotFoundError) {
        throw new NotFoundException('Image file not found');
      }

      this.logger.error(
        `Failed to read image file for "${id}"`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    const image = await this.prisma.client.image.findUnique({
      where: { id },
      include: IMAGE_USAGE_INCLUDE,
    });

    if (!image) {
      throw new NotFoundException('Image not found');
    }

    const usage = this.toUsage(image);

    if (usage.total > 0) {
      throw new ConflictException(this.buildInUseMessage(usage));
    }

    // Remove the database record first so foreign keys remain the final
    // guard against deleting a file that a concurrent change just attached
    // to a product. If storage cleanup fails, recreate the metadata record
    // so the image stays consistent and retryable.
    try {
      await this.prisma.client.image.delete({ where: { id } });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        (error.code === 'P2003' || error.code === 'P2014')
      ) {
        throw new ConflictException(
          'This image is still in use and cannot be deleted. Remove it from the records that reference it first.',
        );
      }

      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Image not found');
      }

      this.logger.error(
        `Failed to delete image record "${id}"`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new InternalServerErrorException('Failed to delete the image');
    }

    try {
      await this.storage.delete(image.storageKey);
    } catch (error) {
      this.logger.error(
        `Failed to delete image file "${image.storageKey}"; restoring metadata record`,
        error instanceof Error ? error.stack : undefined,
      );
      await this.restoreImageRecord(image);
      throw new InternalServerErrorException('Failed to delete the image');
    }
  }

  private buildOrderBy(
    query: QueryImagesDto,
  ): Prisma.ImageOrderByWithRelationInput {
    const field = query.sortBy ?? 'createdAt';
    const order =
      query.sortOrder ?? (field === 'originalName' ? 'asc' : 'desc');

    switch (field) {
      case 'originalName':
        return { originalName: order };
      case 'size':
        return { size: order };
      default:
        return { createdAt: order };
    }
  }

  private toUsage(image: ImageWithUsage): ImageUsageResponse {
    const productCount = image._count.products;

    return {
      total:
        productCount +
        (image.businessProfileLogo ? 1 : 0) +
        (image.invoiceLogo ? 1 : 0),
      productCount,
      businessProfileLogo: image.businessProfileLogo !== null,
      invoiceLogo: image.invoiceLogo !== null,
    };
  }

  private buildInUseMessage(usage: ImageUsageResponse): string {
    const references: string[] = [];

    if (usage.productCount > 0) {
      references.push(
        `${usage.productCount} ${usage.productCount === 1 ? 'product' : 'products'}`,
      );
    }
    if (usage.businessProfileLogo) {
      references.push('the business profile logo');
    }
    if (usage.invoiceLogo) {
      references.push('the invoice logo');
    }

    return `This image is still in use by ${references.join(', ')}. Remove it from those records before deleting it.`;
  }

  private async restoreImageRecord(image: ImageWithUsage): Promise<void> {
    try {
      await this.prisma.client.image.create({
        data: {
          id: image.id,
          originalName: image.originalName,
          storageKey: image.storageKey,
          mimeType: image.mimeType,
          size: image.size,
          width: image.width,
          height: image.height,
          altText: image.altText,
          createdAt: image.createdAt,
          updatedAt: image.updatedAt,
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to restore image record "${image.id}" after storage deletion failed`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  private toResponse(
    image: Image,
    usage: ImageUsageResponse = EMPTY_IMAGE_USAGE,
  ): ImageResponse {
    return {
      id: image.id,
      originalName: image.originalName,
      mimeType: image.mimeType,
      size: image.size,
      width: image.width,
      height: image.height,
      altText: image.altText,
      url: `${IMAGE_API_ROUTE}/${image.id}/file`,
      usage,
      createdAt: image.createdAt,
      updatedAt: image.updatedAt,
    };
  }

  private async cleanupStoredFile(storageKey: string): Promise<void> {
    try {
      await this.storage.delete(storageKey);
    } catch (error) {
      this.logger.warn(
        `Failed to clean up stored file "${storageKey}" after a database error`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
