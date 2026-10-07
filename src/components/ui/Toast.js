"use client";
import { useCart } from "@/context/CartContext";

export default function Toast() {
  const { toast } = useCart();
  if (!toast) return null;
  return <div key={toast.id} role="status" className="fixed inset-x-4 bottom-24 z-[90] mx-auto w-fit max-w-sm animate-up rounded-xl bg-primary-dark px-4 py-2.5 text-center text-sm text-cream shadow-2xl ring-1 ring-accent/50">{toast.msg}</div>;
}
