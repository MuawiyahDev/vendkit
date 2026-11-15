import { notFound } from "next/navigation";

import { SettingsCategoryView } from "@/features/settings/components/settings-category-view";
import { isSettingsCategory } from "@/features/settings/settings.types";

interface SettingsCategoryPageProps {
  params: Promise<{ category: string }>;
}

export default async function SettingsCategoryPage({
  params,
}: SettingsCategoryPageProps) {
  const { category } = await params;

  if (!isSettingsCategory(category)) {
    notFound();
  }

  return <SettingsCategoryView category={category} />;
}
