import { SettingsProvider } from "@/features/settings/components/settings-provider";
import { SettingsShell } from "@/features/settings/components/settings-shell";

export default function SettingsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SettingsProvider>
      <SettingsShell>{children}</SettingsShell>
    </SettingsProvider>
  );
}
