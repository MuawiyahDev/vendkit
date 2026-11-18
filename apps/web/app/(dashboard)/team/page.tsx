import type { Metadata } from "next";

import { TeamPage } from "@/features/users/components/team-page";

export const metadata: Metadata = {
  title: "Team",
};

export default function TeamRoutePage() {
  return <TeamPage />;
}
