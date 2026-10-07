export default function Pagination({ page, pages, onChange, compact = false }) {
  if (pages <= 1) return null;
  const btn = `${compact ? "h-8 min-w-8" : "h-9 min-w-9"} rounded-lg px-2 text-sm transition disabled:opacity-40`;
  const idle = compact ? "bg-cream/70 hover:bg-primary-light" : "bg-white hover:bg-primary-light";
  return (
    <nav aria-label="Pagination" className={`flex items-center justify-center gap-1.5 ${compact ? "mt-1" : "mt-5"}`}>
      <button disabled={page === 1} onClick={() => onChange(page - 1)} aria-label="Previous page" className={`${btn} ${idle}`}>‹</button>
      {Array.from({ length: pages }, (_, k) => k + 1).map((p) => (
        <button key={p} onClick={() => onChange(p)} aria-current={p === page ? "page" : undefined} className={`${btn} ${p === page ? "bg-primary text-white" : idle}`}>{p}</button>
      ))}
      <button disabled={page === pages} onClick={() => onChange(page + 1)} aria-label="Next page" className={`${btn} ${idle}`}>›</button>
    </nav>
  );
}
