import { Transform, Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export const MAX_PAGE_SIZE = 100;

/** MIME types accepted by the upload endpoint. */
export const IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const;

export type ImageMimeType = (typeof IMAGE_MIME_TYPES)[number];

export const IMAGE_SORT_FIELDS = ['createdAt', 'originalName', 'size'] as const;

export type ImageSortField = (typeof IMAGE_SORT_FIELDS)[number];

export const IMAGE_SORT_ORDERS = ['asc', 'desc'] as const;

export type ImageSortOrder = (typeof IMAGE_SORT_ORDERS)[number];

export class QueryImagesDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_SIZE)
  limit?: number;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsIn(IMAGE_MIME_TYPES)
  mimeType?: ImageMimeType;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsIn(IMAGE_SORT_FIELDS)
  sortBy?: ImageSortField;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsIn(IMAGE_SORT_ORDERS)
  sortOrder?: ImageSortOrder;
}
