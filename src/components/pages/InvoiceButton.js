"use client";
import Link from "next/link";
import { useI18n } from "@/context/I18nContext";
import { useCatalog } from "@/context/CatalogContext";

// Opens the printable invoice. On that page the "Print / Save as PDF" button makes the PDF.
// `auto` adds ?print=1 so the browser's print dialog opens straight away (one click -> PDF).
export default function InvoiceButton({ id, auto = true, className = "btn text-center" }) {
  const { t } = useI18n();
  if (useCatalog()?.featureToggles?.invoice === false) return null;
  return <Link href={`/account/orders/${id}/invoice${auto ? "?print=1" : ""}`} className={className}>📄 {t("invoice")}</Link>;
}
