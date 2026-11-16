"use client";

import {
  ArrowUpDown,
  LayoutGrid,
  List,
  ListFilter,
  RefreshCw,
  RotateCcw,
} from "lucide-react";

import { NativeSelect } from "@/components/shared/native-select";
import { SearchInput } from "@/components/shared/search-input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type {
  ImageSortField,
  ImageSortOrder,
  ImageTypeFilter,
} from "../api/images-api";
import {
  IMAGE_SORT_OPTIONS,
  IMAGE_TYPE_OPTIONS,
  readImageSortOption,
  readImageTypeFilter,
  type ImageViewMode,
} from "../images.constants";
import type { PendingUpload } from "../hooks/use-image-uploads";
import { ImageUploadButton } from "./image-upload-button";
import { ImageUploadQueue } from "./image-upload-queue";

interface ImageLibraryToolbarProps {
  searchInput: string;
  onSearchChange: (value: string) => void;
  isInitialLoading: boolean;
  isFetching: boolean;
  total: number | null;
  typeFilter: ImageTypeFilter;
  onTypeFilterChange: (value: ImageTypeFilter) => void;
  sortBy: ImageSortField;
  sortOrder: ImageSortOrder;
  onSortChange: (sort: {
    sortBy: ImageSortField;
    sortOrder: ImageSortOrder;
  }) => void;
  viewMode: ImageViewMode;
  onViewModeChange: (value: ImageViewMode) => void;
  showCount: boolean;
  showFilters: boolean;
  showViewToggle: boolean;
  showUpload: boolean;
  hasActiveFilters: boolean;
  onResetFilters: () => void;
  onRefresh: () => void;
  onFiles: (files: File[]) => void;
  isUploading: boolean;
  uploads: PendingUpload[];
  uploadError: string | null;
  onDismissUploadError: () => void;
  className?: string;
}

/**
 * Compact search, filter, sort, layout, refresh, and upload controls shared
 * by the Media Library page and the image picker dialog.
 */
export function ImageLibraryToolbar({
  searchInput,
  onSearchChange,
  isInitialLoading,
  isFetching,
  total,
  typeFilter,
  onTypeFilterChange,
  sortBy,
  sortOrder,
  onSortChange,
  viewMode,
  onViewModeChange,
  showCount,
  showFilters,
  showViewToggle,
  showUpload,
  hasActiveFilters,
  onResetFilters,
  onRefresh,
  onFiles,
  isUploading,
  uploads,
  uploadError,
  onDismissUploadError,
  className,
}: ImageLibraryToolbarProps) {
  const sortValue = `${sortBy}:${sortOrder}`;

  return (
    <div
      className={cn(
        "border-border-subtle flex flex-col gap-3 border-b px-4 py-3.5 sm:px-5 sm:py-4",
        className,
      )}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <SearchInput
          value={searchInput}
          onChange={onSearchChange}
          disabled={isInitialLoading}
          placeholder="Search by filename…"
          ariaLabel="Search images"
          className="sm:max-w-md"
        />

        <div className="flex flex-wrap items-center gap-2">
          {showCount && total !== null ? (
            <span className="text-muted-foreground mr-auto text-xs whitespace-nowrap tabular-nums sm:mr-1">
              {total.toLocaleString()} {total === 1 ? "image" : "images"}
            </span>
          ) : null}

          {showFilters && hasActiveFilters ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onResetFilters}
              disabled={isInitialLoading}
              className="text-muted-foreground hover:text-foreground"
            >
              <RotateCcw aria-hidden="true" />
              <span className="hidden sm:inline">Reset</span>
            </Button>
          ) : null}

          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={onRefresh}
            disabled={isInitialLoading || isFetching}
            aria-label="Refresh images"
            title="Refresh images"
          >
            <RefreshCw
              className={isFetching ? "animate-spin" : undefined}
              aria-hidden="true"
            />
          </Button>

          {showUpload ? (
            <ImageUploadButton
              onFiles={onFiles}
              isUploading={isUploading}
              disabled={isInitialLoading}
            />
          ) : null}
        </div>
      </div>

      {showFilters || showViewToggle ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          {showFilters ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="flex flex-1 items-center gap-2 sm:flex-none">
                <ListFilter
                  className="text-muted-foreground hidden size-3.5 shrink-0 sm:block"
                  aria-hidden="true"
                />
                <NativeSelect
                  ariaLabel="Filter by image type"
                  value={typeFilter}
                  disabled={isInitialLoading}
                  onChange={(event) => {
                    const next = readImageTypeFilter(event.target.value);
                    if (next !== null) {
                      onTypeFilterChange(next);
                    }
                  }}
                  className="w-full sm:w-40"
                  options={IMAGE_TYPE_OPTIONS}
                />
              </div>

              <div className="flex flex-1 items-center gap-2 sm:flex-none">
                <ArrowUpDown
                  className="text-muted-foreground hidden size-3.5 shrink-0 sm:block"
                  aria-hidden="true"
                />
                <NativeSelect
                  ariaLabel="Sort images"
                  value={sortValue}
                  disabled={isInitialLoading}
                  onChange={(event) => {
                    const next = readImageSortOption(event.target.value);
                    if (next !== null) {
                      onSortChange(next);
                    }
                  }}
                  className="w-full sm:w-44"
                  options={IMAGE_SORT_OPTIONS.map((option) => ({
                    value: option.value,
                    label: option.label,
                  }))}
                />
              </div>
            </div>
          ) : null}

          {showViewToggle ? (
            <div
              role="group"
              aria-label="Image layout"
              className="border-border-subtle bg-surface-muted/60 inline-flex items-center gap-0.5 self-start rounded-lg border p-0.5 shadow-xs sm:ml-auto sm:self-auto"
            >
              <Button
                type="button"
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon-sm"
                aria-label="Grid view"
                aria-pressed={viewMode === "grid"}
                title="Grid view"
                onClick={() => onViewModeChange("grid")}
              >
                <LayoutGrid aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="icon-sm"
                aria-label="List view"
                aria-pressed={viewMode === "list"}
                title="List view"
                onClick={() => onViewModeChange("list")}
              >
                <List aria-hidden="true" />
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}

      <ImageUploadQueue
        uploads={uploads}
        error={uploadError}
        onDismissError={onDismissUploadError}
      />
    </div>
  );
}
