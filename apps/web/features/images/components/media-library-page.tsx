import { ImageLibrary } from "./image-library";

/**
 * Full Media Library screen. Reuses the same library component and stored
 * image records as every image picker in the app.
 */
export function MediaLibraryPage() {
  return <ImageLibrary variant="page" />;
}
