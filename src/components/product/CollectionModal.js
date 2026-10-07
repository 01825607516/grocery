"use client";
import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Pagination from "@/components/ui/Pagination";
import ProductCard from "./ProductCard";
import { hay } from "@/lib/searchText";

const PAGE_SIZE = 5; // 10 products per category = 2 pages

// Shared by Category / Brand / Campaign / Wishlist popups (tabs + search + paginated grid)
export default function CollectionModal({ open, onClose, title, subs = [], products }) {
  const [sub, setSub] = useState("All");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const list = products.filter((p) => (sub === "All" || p.sub === sub) && hay(p.name).includes(q.trim().toLowerCase()));
  const pages = Math.ceil(list.length / PAGE_SIZE);
  const visible = list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <Modal open={open} onClose={onClose} title={title}>
      {subs.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {["All", ...subs].map((s) => (
            <button key={s} onClick={() => { setSub(s); setPage(1); }} className={`rounded-full px-4 py-1.5 text-sm ${sub === s ? "bg-primary text-white" : "bg-white"}`}>{s}</button>
          ))}
        </div>
      )}
      <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder={`Search in ${title}`} className="mb-4 w-full rounded-lg border border-accent/40 bg-white px-3 py-2 text-sm outline-none focus:border-primary" />
      {visible.length ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">{visible.map((p) => <ProductCard key={p.id} product={p} compact />)}</div>
      ) : <p className="py-10 text-center text-ink/60">No products found. Try another search or tab.</p>}
      <Pagination page={page} pages={pages} onChange={setPage} />
    </Modal>
  );
}
