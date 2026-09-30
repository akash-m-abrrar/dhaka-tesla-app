import type { Metadata } from "next";
import { ProtectedAppShell } from "@/components/auth/protected-app-shell";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function ProtectedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <ProtectedAppShell>{children}</ProtectedAppShell>;
}
