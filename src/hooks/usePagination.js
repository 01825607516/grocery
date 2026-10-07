"use client";
import { useState } from "react";

export default function usePagination(items, perPage) {
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(items.length / perPage));
  const cur = Math.min(page, pages - 1);
  return { page: cur, pages, setPage, slice: items.slice(cur * perPage, cur * perPage + perPage) };
}
