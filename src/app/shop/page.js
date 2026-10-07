"use client";
import { Suspense } from "react";
import PageShell from "@/components/layout/PageShell";
import ShopView from "@/components/pages/ShopView";

export default function ShopPage() {
  return <PageShell title="Shop all products"><Suspense fallback={null}><ShopView /></Suspense></PageShell>;
}
