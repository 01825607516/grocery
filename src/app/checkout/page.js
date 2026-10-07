"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PageShell from "@/components/layout/PageShell";
import CheckoutModal from "@/components/cart/CheckoutModal";
import { AuthGate } from "@/components/pages/common";
import { useCart } from "@/context/CartContext";

// Checkout as a normal page. It is the SAME checkout the popup uses (address, delivery slot, payment, review, place order, live tracking).
export default function CheckoutPage() {
  const router = useRouter();
  const { closeBuyNow } = useCart();
  return (
    <PageShell title="Checkout" bare>
      <AuthGate why="Please log in to place your order.">
        <Link href="/cart" className="mb-4 inline-block text-sm font-semibold text-primary underline">← Back to cart</Link>
        <CheckoutModal open page onClose={() => { closeBuyNow(); router.push("/"); }} />
      </AuthGate>
    </PageShell>
  );
}
