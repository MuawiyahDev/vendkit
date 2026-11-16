import { SettingsSection } from "../../settings/components/settings-section";
import { INCLUDED_DATA_GROUPS } from "../utils/backups.utils";

interface BackupIncludedSectionProps {
  formatVersion: number;
  appVersion: string;
}

export function BackupIncludedSection({
  formatVersion,
  appVersion,
}: BackupIncludedSectionProps) {
  return (
    <SettingsSection
      title="Included in every backup"
      description={`Backup format v${formatVersion} for VendKit ${appVersion}. Existing data is preserved with original identifiers and relationships.`}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {INCLUDED_DATA_GROUPS.map((group) => (
          <div
            key={group.title}
            className="border-border-subtle rounded-lg border px-3.5 py-3"
          >
            <p className="text-sm font-medium">{group.title}</p>
            <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
              {group.description}
            </p>
          </div>
        ))}
      </div>
    </SettingsSection>
  );
}
