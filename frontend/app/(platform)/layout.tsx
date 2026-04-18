import type { ReactNode } from "react";
import { headers } from "next/headers";

import { AppShell } from "@/components/layout/app-shell";

export default async function PlatformLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const headersList = await headers();
  const currentPath = headersList.get("x-pathname") ?? "/";

  return <AppShell currentPath={currentPath}>{children}</AppShell>;
}
