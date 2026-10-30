"use client";

import { AlertCircle, Images, RefreshCw, SearchX } from "lucide-react";
import { useCallback, useState } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { SearchInput } from "@/components/shared/search-input";
import { TablePagination } from "@/components/shared/table-pagination";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

import {
  toPickedImage,
  type Image,
  type PickedImage,
} from "../api/images-api";
import { useImageUploads } from "../hooks/use-image-uploads";
import { useImages } from "../hooks/use-images";
import { ImageDeleteDialog } from "./image-delete-dialog";
import { ImageLibrarySkeleton } from "./image-library-skeleton";
import { ImagePreviewDialog } from "./image-preview-dialog";
import { ImageTile, type ImageSelectionMode } from "./image-tile";
import { ImageUploadButton } from "./image-upload-button";
import { ImageUploadQueue } from "./image-upload-queue";

const PAGE_SIZE_OPTIONS = [12, 24, 48, 96] as const;

interface ImageLibraryProps {
  /** When enabled, tiles become selectable and report changes upward. */
  selectionMode?: ImageSelectionMode;
  /** Current ordered selection; may include images on other pages. */
  selected?: readonly PickedImage[];
  onSelectionChange?: (images: PickedImage[]) => void;
  className?: string;
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
  className,
}: ImageLibraryProps) {
  const {
    view,
    isFetching,
    searchInput,
    debouncedSearch,
    setSearchInput,
    setPage,
    setPageSize,
    refresh,
  } = useImages();

  const [deleteTarget, setDeleteTarget] = useState<Image | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<Image | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const { uploads, error, isUploading, uploadFiles, dismissError } =
    useImageUploads({
      onUploaded: () => refresh(),
    });

  const handleRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  const handleToggleSelection = useCallback(
    (image: Image) => {
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
    [selectionMode, onSelectionChange, selected],
  );

  const handleDeleteSuccess = useCallback(
    (image: Image) => {
      setDeleteTarget(null);
      setDeleteDialogOpen(false);

      // Keep a deleted selection consistent with the library.
      if (selected.some((item) => item.id === image.id)) {
        onSelectionChange?.(selected.filter((item) => item.id !== image.id));
      }

      // Step back a page when the removed tile was the last one on it.
      const meta = view.status === "success" ? view.data.meta : null;
      const remaining = meta ? meta.total - 1 : 0;
      if (meta && meta.page > 1 && remaining <= (meta.page - 1) * meta.limit) {
        setPage(meta.page - 1);
        return;
      }
      refresh();
    },
    [selected, onSelectionChange, view, setPage, refresh],
  );

  const isInitialLoading = view.status === "loading";
  const hasSearchQuery = debouncedSearch.length > 0;
  const images = view.status === "success" ? view.data.data : [];
  const meta = view.status === "success" ? view.data.meta : null;

  return (
    <div className={className}>
      <div className="border-border-subtle flex flex-col gap-3 border-b px-4 py-3.5 sm:px-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <SearchInput
            value={searchInput}
            onChange={setSearchInput}
            disabled={isInitialLoading}
            placeholder="Search images…"
            ariaLabel="Search images"
          />

          <div className="flex items-center gap-2">
            {meta ? (
              <span className="text-muted-foreground mr-auto text-xs whitespace-nowrap tabular-nums">
                {meta.total.toLocaleString()}{" "}
                {meta.total === 1 ? "image" : "images"}
              </span>
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={isInitialLoading || isFetching}
              aria-label="Refresh images"
              title="Refresh images"
            >
              <RefreshCw
                className={isFetching ? "animate-spin" : undefined}
                aria-hidden="true"
              />
            </Button>
            <ImageUploadButton
              onFiles={(files) => void uploadFiles(files)}
              isUploading={isUploading}
              disabled={isInitialLoading}
            />
          </div>
        </div>

        <ImageUploadQueue
          uploads={uploads}
          error={error}
          onDismissError={dismissError}
        />
      </div>

      {view.status === "error" ? (
        <div className="flex flex-col items-center gap-4 px-6 py-12 text-center">
          <Alert variant="destructive" className="max-w-md text-left">
            <AlertCircle aria-hidden="true" />
            <AlertDescription>{view.message}</AlertDescription>
          </Alert>
          <Button type="button" variant="outline" onClick={handleRefresh}>
            Try again
          </Button>
        </div>
      ) : isInitialLoading ? (
        <ImageLibrarySkeleton />
      ) : images.length === 0 ? (
        hasSearchQuery ? (
          <EmptyState
            icon={SearchX}
            title="No images found"
            description={`No images match “${debouncedSearch}”. Try another search.`}
            className="rounded-none border-0 bg-transparent py-14"
          >
            <Button type="button" variant="outline" onClick={() => setSearchInput("")}>
              Clear search
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
              onFiles={(files) => void uploadFiles(files)}
              isUploading={isUploading}
            />
          </EmptyState>
        )
      ) : (
        <ul
          aria-label="Image library"
          aria-busy={isFetching}
          className="grid grid-cols-2 gap-3 px-4 py-4 sm:grid-cols-3 sm:px-5 lg:grid-cols-4"
        >
          {images.map((image) => (
            <ImageTile
              key={image.id}
              image={image}
              selectionMode={selectionMode}
              isSelected={selected.some((item) => item.id === image.id)}
              onToggle={() => handleToggleSelection(image)}
              onPreview={() => {
                setPreviewImage(image);
                setPreviewOpen(true);
              }}
              onDelete={() => {
                setDeleteTarget(image);
                setDeleteDialogOpen(true);
              }}
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
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          onPageSizeChange={setPageSize}
        />
      ) : null}

      <ImagePreviewDialog
        image={previewImage}
        open={previewOpen}
        onOpenChange={(open) => {
          setPreviewOpen(open);
          if (!open) {
            setPreviewImage(null);
          }
        }}
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
    </div>
  );
}
