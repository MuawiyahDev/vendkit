import type { Metadata } from "next";

import { MediaLibraryPage } from "@/features/images/components/media-library-page";

export const metadata: Metadata = {
  title: "Media Library",
};

export default function MediaRoutePage() {
  return <MediaLibraryPage />;
}
