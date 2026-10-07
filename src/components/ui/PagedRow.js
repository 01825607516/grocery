"use client";
import { useState } from "react";
import usePerPage from "@/hooks/usePerPage";
import Pagination from "./Pagination";

// One single row of items with pagination (no scrolling)
export default function PagedRow({ items, render }) {
  const per = usePerPage();
  const [page, setPage] = useState(1);
  const pages = Math.ceil(items.length / per);
  const cur = Math.min(page, pages);
  return (
    <>
      <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6">{items.slice((cur - 1) * per, cur * per).map(render)}</div>
      <Pagination page={cur} pages={pages} onChange={setPage} />
    </>
  );
}
