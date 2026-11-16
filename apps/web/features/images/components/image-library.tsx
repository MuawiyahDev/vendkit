"use client";

import { AlertCircle, Images, RefreshCw, SearchX, Trash2 } from "lucide-react";
import { useCallback, useState } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { SuccessAlert } from "@/components/shared/success-alert";
import { TablePagination } from "@/components/shared/table-pagination";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { toPickedImage, type Image, type PickedImage } from "../api/images-api";
import { useImageUploads } from "../hooks/use-image-uploads";
import { useImages } from "../hooks/use-images";
import {
  IMAGE_PAGE_SIZE_OPTIONS,
  type ImageViewMode,
} from "../images.constants";
import { ImageBulkDeleteDialog } from "./image-bulk-delete-dialog";
import { ImageDeleteDialog } from "./image-delete-dialog";
import { ImageDropzone } from "./image-dropzone";
import { ImageLibrarySkeleton } from "./image-library-skeleton";
import { ImageLibraryToolbar } from "./image-library-toolbar";
import { ImagePreviewDialog } from "./image-preview-dialog";
import { ImageTile, type ImageSelectionMode } from "./image-tile";
import { ImageUploadButton } from "./image-upload-button";
import { MediaLibraryStats } from "./media-library-stats";

export type ImageLibraryVariant = "page" | "embedded";

interface ImageLibraryProps {
  /** When enabled, tiles become selectable and report changes upward. */
  selectionMode?: ImageSelectionMode;
  /** Current ordered selection; may include images on other pages. */
  selected?: readonly PickedImage[];
  onSelectionChange?: (images: PickedImage[]) => void;
  /**
   * `page` renders a full Media Library screen with a page header and
   * filters; `embedded` keeps the compact toolbar used inside pickers.
   */
  variant?: ImageLibraryVariant;
  className?: string;
}

function uploadedMessage(count: number): string {
  return count === 1
    ? "1 image uploaded and added to your library."
    : `${count} images uploaded and added to your library.`;
}

function deletedMessage(image: Image): string {
  return `“${image.originalName}” was deleted.`;
}

/**
 * The reusable image library: browses, searches, uploads, previews, and
 * deletes stored images, with optional single/multiple selection. Owns no
 * domain-specific logic, so any feature can embed it.
 */
export function ImageLibrary({
  selectionMode = "none",
  selected = [],
  onSelectionChange,
  variant = "embedded",
  className,
}: ImageLibraryProps) {
  const {
    view,
    isFetching,
    searchInput,
    debouncedSearch,
    setSearchInput,
    typeFilter,
    setTypeFilter,
    sortBy,
    sortOrder,
    setSort,
    setPage,
    setPageSize,
    refresh,
    clearFilters,
  } = useImages();

  const [viewMode, setViewMode] = useState<ImageViewMode>("grid");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [statsRefreshToken, setStatsRefreshToken] = useState(0);
  const [pageSelection, setPageSelection] = useState<Image[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Image | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<Image | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const { uploads, error, isUploading, uploadFiles, dismissError } =
    useImageUploads();

  const isPage = variant === "page";
  const isInitialLoading = view.status === "loading";
  const hasSearchQuery = debouncedSearch.length > 0;
  const hasActiveFilters = hasSearchQuery || typeFilter !== "all";
  const images = view.status === "success" ? view.data.data : [];
  const meta = view.status === "success" ? view.data.meta : null;

  const handleRefresh = useCallback(() => {
    refresh();
    setStatsRefreshToken((token) => token + 1);
  }, [refresh]);

  const handleFiles = useCallback(
    (files: File[]) => {
      void (async () => {
        const uploadedCount = await uploadFiles(files);
        if (uploadedCount > 0) {
          setFeedback(uploadedMessage(uploadedCount));
          refresh();
          setStatsRefreshToken((token) => token + 1);
        }
      })();
    },
    [uploadFiles, refresh],
  );

  const handleToggleSelection = useCallback(
    (image: Image) => {
      if (isPage) {
        setPageSelection((current) =>
          current.some((item) => item.id === image.id)
            ? current.filter((item) => item.id !== image.id)
            : [...current, image],
        );
        return;
      }

      if (selectionMode === "none" || !onSelectionChange) {
        return;
      }

      const isSelected = selected.some((item) => item.id === image.id);

      if (selectionMode === "single") {
        onSelectionChange(isSelected ? [] : [toPickedImage(image)]);
        return;
      }

      onSelectionChange(
        isSelected
          ? selected.filter((item) => item.id !== image.id)
          : [...selected, toPickedImage(image)],
      );
    },
    [isPage, selectionMode, onSelectionChange, selected],
  );

  const handleDeleteRequest = useCallback((image: Image) => {
    setPreviewOpen(false);
    setPreviewImage(null);
    setDeleteTarget(image);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteSuccess = useCallback(
    (image: Image) => {
      setDeleteTarget(null);
      setDeleteDialogOpen(false);
      setFeedback(deletedMessage(image));
      setStatsRefreshToken((token) => token + 1);

      // Keep a deleted selection consistent with the library.
      if (isPage) {
        setPageSelection((current) =>
          current.filter((item) => item.id !== image.id),
        );
      } else if (selected.some((item) => item.id === image.id)) {
        onSelectionChange?.(selected.filter((item) => item.id !== image.id));
      }

      // Step back a page when the removed tile was the last one on it.
      const currentMeta = view.status === "success" ? view.data.meta : null;
      const remaining = currentMeta ? currentMeta.total - 1 : 0;
      if (
        currentMeta &&
        currentMeta.page > 1 &&
        remaining <= (currentMeta.page - 1) * currentMeta.limit
      ) {
        setPage(currentMeta.page - 1);
        return;
      }
      refresh();
    },
    [isPage, selected, onSelectionChange, view, setPage, refresh],
  );

  const handleBulkDeleted = useCallback(
    (deleted: Image[]) => {
      if (deleted.length === 0) {
        return;
      }

      const deletedIds = new Set(deleted.map((image) => image.id));
      setPageSelection((current) =>
        current.filter((item) => !deletedIds.has(item.id)),
      );
      const onlyImage = deleted.length === 1 ? deleted[0] : null;
      setFeedback(
        onlyImage
          ? deletedMessage(onlyImage)
          : `${deleted.length} images were deleted.`,
      );
      setStatsRefreshToken((token) => token + 1);

      const currentMeta = view.status === "success" ? view.data.meta : null;
      if (currentMeta) {
        const remaining = Math.max(currentMeta.total - deleted.length, 0);
        const targetPage = Math.max(
          1,
          Math.min(currentMeta.page, Math.ceil(remaining / currentMeta.limit)),
        );
        if (targetPage !== currentMeta.page) {
          setPage(targetPage);
          return;
        }
      }

      refresh();
    },
    [view, setPage, refresh],
  );

  const handleClearSelection = useCallback(() => {
    setPageSelection([]);
  }, []);

  const gridClasses = isPage
    ? "grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 sm:gap-4 sm:p-5 lg:grid-cols-4 xl:grid-cols-5"
    : "grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 sm:p-5";

  return (
    <div
      className={cn(
        isPage ? "flex flex-col gap-6" : "flex flex-col",
        className,
      )}
    >
      {isPage ? (
        <PageHeader
          title="Media Library"
          description="Upload images once and reuse them across products, invoices, and settings. Images in use stay protected until they are detached."
          actions={
            <ImageUploadButton
              onFiles={handleFiles}
              isUploading={isUploading}
              disabled={isInitialLoading}
              className="w-full sm:w-auto"
            />
          }
        />
      ) : null}

      {feedback ? (
        <SuccessAlert message={feedback} onDismiss={() => setFeedback(null)} />
      ) : null}

      {isPage ? <MediaLibraryStats refreshToken={statsRefreshToken} /> : null}

      <ImageDropzone
        onFiles={handleFiles}
        disabled={isUploading || isInitialLoading}
        className={isPage ? undefined : "flex flex-col"}
      >
        <Card
          aria-busy={isFetching}
          className={cn(
            "gap-0 overflow-hidden py-0",
            isPage
              ? "bg-card"
              : "bg-transparent rounded-none border-0 shadow-none",
          )}
        >
          <ImageLibraryToolbar
            searchInput={searchInput}
            onSearchChange={setSearchInput}
            isInitialLoading={isInitialLoading}
            isFetching={isFetching}
            total={meta ? meta.total : null}
            typeFilter={typeFilter}
            onTypeFilterChange={setTypeFilter}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortChange={setSort}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            showCount={!isPage || hasActiveFilters}
            showFilters={isPage}
            showViewToggle={isPage}
            showUpload={!isPage}
            hasActiveFilters={hasActiveFilters}
            onResetFilters={clearFilters}
            onRefresh={handleRefresh}
            onFiles={handleFiles}
            isUploading={isUploading}
            uploads={uploads}
            uploadError={error}
            onDismissUploadError={dismissError}
          />

          {isPage && pageSelection.length > 0 ? (
            <div className="border-border-subtle bg-primary-soft/40 flex flex-wrap items-center gap-x-3 gap-y-2 border-b px-4 py-2.5 sm:px-5">
              <span
                aria-live="polite"
                className="text-primary-soft-foreground text-xs font-medium tabular-nums"
              >
                {pageSelection.length} selected
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearSelection}
              >
                Clear
              </Button>
              <Button
                type="button"
                variant="destructive-outline"
                size="sm"
                className="ml-auto"
                onClick={() => setBulkDeleteOpen(true)}
              >
                <Trash2 aria-hidden="true" />
                Delete selected
              </Button>
            </div>
          ) : null}

          {view.status === "error" ? (
            <div className="flex flex-col items-center gap-4 px-6 py-12 text-center">
              <Alert variant="destructive" className="max-w-md text-left">
                <AlertCircle aria-hidden="true" />
                <AlertDescription>{view.message}</AlertDescription>
              </Alert>
              <Button type="button" variant="outline" onClick={handleRefresh}>
                <RefreshCw aria-hidden="true" />
                Try again
              </Button>
            </div>
          ) : isInitialLoading ? (
            <ImageLibrarySkeleton layout={isPage ? viewMode : "grid"} />
          ) : images.length === 0 ? (
            hasActiveFilters ? (
              <EmptyState
                icon={SearchX}
                title="No images found"
                description={
                  hasSearchQuery
                    ? `No images match “${debouncedSearch}”. Try another search or adjust your filters.`
                    : "No images match the selected filters."
                }
                className="rounded-none border-0 bg-transparent py-14"
              >
                <Button type="button" variant="outline" onClick={clearFilters}>
                  Clear filters
                </Button>
              </EmptyState>
            ) : (
              <EmptyState
                icon={Images}
                title="No images yet"
                description="Upload images once and reuse them across products whenever you need them."
                className="rounded-none border-0 bg-transparent py-14"
              >
                <ImageUploadButton
                  onFiles={handleFiles}
                  isUploading={isUploading}
                />
              </EmptyState>
            )
          ) : (
            <ul
              aria-label="Image library"
              aria-busy={isFetching}
              className={
                isPage && viewMode === "list"
                  ? "flex flex-col gap-2 p-4 sm:p-5"
                  : gridClasses
              }
            >
              {images.map((image) => (
                <ImageTile
                  key={image.id}
                  image={image}
                  layout={isPage ? viewMode : "grid"}
                  selectionMode={isPage ? "multiple" : selectionMode}
                  activateOnSelect={!isPage}
                  isSelected={
                    isPage
                      ? pageSelection.some((item) => item.id === image.id)
                      : selected.some((item) => item.id === image.id)
                  }
                  onToggle={() => handleToggleSelection(image)}
                  onPreview={() => {
                    setPreviewImage(image);
                    setPreviewOpen(true);
                  }}
                  onDelete={() => handleDeleteRequest(image)}
                />
              ))}
            </ul>
          )}

          {meta ? (
            <TablePagination
              meta={meta}
              onPageChange={setPage}
              disabled={view.status !== "success"}
              itemLabel="images"
              pageSizeOptions={IMAGE_PAGE_SIZE_OPTIONS}
              onPageSizeChange={setPageSize}
            />
          ) : null}
        </Card>
      </ImageDropzone>

      <ImagePreviewDialog
        image={previewImage}
        open={previewOpen}
        onOpenChange={(open) => {
          setPreviewOpen(open);
          if (!open) {
            setPreviewImage(null);
          }
        }}
        onDelete={handleDeleteRequest}
      />

      <ImageDeleteDialog
        image={deleteTarget}
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) {
            setDeleteTarget(null);
          }
        }}
        onSuccess={handleDeleteSuccess}
      />

      {isPage ? (
        <ImageBulkDeleteDialog
          images={pageSelection}
          open={bulkDeleteOpen}
          onOpenChange={setBulkDeleteOpen}
          onDeleted={handleBulkDeleted}
        />
      ) : null}
    </div>
  );
}
