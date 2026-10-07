"use client";
import { Suspense } from "react";
import PageShell from "@/components/layout/PageShell";
import { useCatalog } from "@/context/CatalogContext";
import ShopView from "./ShopView";
import { Missing } from "./common";

export default function CategoryPage({ id }) {
  const { categories } = useCatalog();
  const category = categories.find((c) => c.id === id);
  return (
    <PageShell title={category ? category.name : "Category"}>
      {category ? <Suspense fallback={null}><ShopView category={category} /></Suspense> : <Missing title="Category not found" text="Pick one from the Pages menu or browse all products." />}
    </PageShell>
  );
}
