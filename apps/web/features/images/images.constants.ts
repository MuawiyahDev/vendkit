import type {
  ImageSortField,
  ImageSortOrder,
  ImageTypeFilter,
} from "./api/images-api";

export const IMAGE_PAGE_SIZE_OPTIONS = [12, 24, 48, 96] as const;

export type ImageViewMode = "grid" | "list";

export const DEFAULT_IMAGE_SORT: {
  sortBy: ImageSortField;
  sortOrder: ImageSortOrder;
} = {
  sortBy: "createdAt",
  sortOrder: "desc",
};

export const IMAGE_TYPE_OPTIONS: {
  value: ImageTypeFilter;
  label: string;
}[] = [
  { value: "all", label: "All image types" },
  { value: "image/jpeg", label: "JPEG" },
  { value: "image/png", label: "PNG" },
  { value: "image/webp", label: "WebP" },
  { value: "image/gif", label: "GIF" },
];

export const IMAGE_SORT_OPTIONS: {
  value: string;
  label: string;
  sortBy: ImageSortField;
  sortOrder: ImageSortOrder;
}[] = [
  {
    value: "createdAt:desc",
    label: "Newest first",
    sortBy: "createdAt",
    sortOrder: "desc",
  },
  {
    value: "createdAt:asc",
    label: "Oldest first",
    sortBy: "createdAt",
    sortOrder: "asc",
  },
  {
    value: "originalName:asc",
    label: "Name A–Z",
    sortBy: "originalName",
    sortOrder: "asc",
  },
  {
    value: "originalName:desc",
    label: "Name Z–A",
    sortBy: "originalName",
    sortOrder: "desc",
  },
  {
    value: "size:desc",
    label: "Largest first",
    sortBy: "size",
    sortOrder: "desc",
  },
  {
    value: "size:asc",
    label: "Smallest first",
    sortBy: "size",
    sortOrder: "asc",
  },
];

export function readImageTypeFilter(value: string): ImageTypeFilter | null {
  const match = IMAGE_TYPE_OPTIONS.find((option) => option.value === value);
  return match ? match.value : null;
}

export function readImageSortOption(
  value: string,
): { sortBy: ImageSortField; sortOrder: ImageSortOrder } | null {
  const match = IMAGE_SORT_OPTIONS.find((option) => option.value === value);
  return match ? { sortBy: match.sortBy, sortOrder: match.sortOrder } : null;
}
