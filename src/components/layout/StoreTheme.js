"use client";
import { useEffect, useLayoutEffect } from "react";
import { useCatalog } from "@/context/CatalogContext";
import { applyTheme } from "@/lib/theme";

const useIso = typeof window !== "undefined" ? useLayoutEffect : useEffect;

// Applies the colours / fonts / corners chosen in Website Management. Renders nothing.
export default function StoreTheme() {
  const theme = useCatalog()?.siteContent?.theme;
  const key = JSON.stringify(theme || null);
  useIso(() => { applyTheme(theme); }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}
