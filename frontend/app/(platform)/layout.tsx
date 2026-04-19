import type { ReactNode } from "react";
import { headers } from "next/headers";

import { AppShell } from "@/components/layout/app-shell";
import { NightModeStyles } from "@/components/night-mode/night-mode-styles";
import { NightModePlayer } from "@/components/night-mode/night-mode-player";

export default async function PlatformLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const headersList = await headers();
  const currentPath = headersList.get("x-pathname") ?? "/";

  return (
    <>
      <NightModeStyles />
      <AppShell currentPath={currentPath}>{children}</AppShell>
      <NightModePlayer />
    </>
  );
}
