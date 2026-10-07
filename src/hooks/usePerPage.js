"use client";
import { useEffect, useState } from "react";

const STEPS = [[768, 6], [640, 4], [0, 3]]; // [min screen width, items per page]

export default function usePerPage() {
  const [n, setN] = useState(6);
  useEffect(() => {
    const update = () => setN(STEPS.find(([w]) => window.innerWidth >= w)[1]);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return n;
}
