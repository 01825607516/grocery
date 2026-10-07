"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "@/services";
import { summarize } from "@/lib/reviews";

// Reviews of all products, loaded once (mock backend) or per product when its popup opens (real backend).
const Ctx = createContext(null);

export function ReviewProvider({ children }) {
  const [map, setMap] = useState({}); // { [productId]: [review] }

  useEffect(() => {
    let on = true;
    api.getReviews().then((m) => on && setMap(m || {})).catch(() => {});
    return () => { on = false; };
  }, []);

  const load = useCallback((id) => api.getReviews(id).then((list) => setMap((m) => ({ ...m, [id]: list }))).catch(() => {}), []);
  const summary = useCallback((p) => summarize(map[p.id], p), [map]);
  // one review per customer per product: posting again updates the old one. Throws ApiError (login needed, bad rating...)
  const submit = useCallback(async (p, body) => {
    const r = await api.addReview(p.id, body);
    setMap((m) => ({ ...m, [p.id]: [r, ...(m[p.id] ?? p.reviews ?? []).filter((x) => x.id !== r.id)] }));
    return r;
  }, []);

  // "Helpful" vote (login needed). Throws ApiError.
  const vote = useCallback(async (p, review) => {
    const r = await api.voteReview(p.id, review.id);
    setMap((m) => ({ ...m, [p.id]: (m[p.id] ?? p.reviews ?? []).map((x) => (x.id === r.id ? { ...x, ...r } : x)) }));
    return r;
  }, []);

  const value = useMemo(() => ({ summary, load, submit, vote }), [summary, load, submit, vote]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useReviews = () => useContext(Ctx);
