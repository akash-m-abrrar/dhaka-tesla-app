"use client";

import { useEffect } from "react";
import { useAppSelector } from "@/lib/hooks";

export function ThemeSync() {
  const theme = useAppSelector((state) => state.theme.mode);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return null;
}
