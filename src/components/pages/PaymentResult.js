"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/services";
import { money } from "@/lib/format";
import { Missing, payStatus } from "./common";
import InvoiceButton from "./InvoiceButton";
import { celebrateOrder } from "@/lib/confetti";

const META = {
  success: { icon: "✓", tone: "bg-primary text-white", title: "Payment successful", text: "Thank you! We have received your payment and started preparing your order." },
  fail: { icon: "!", tone: "bg-red-600 text-white", title: "Payment failed", text: "Your payment was not completed. You can go back to your cart and try again." },
  cancel: { icon: "×", tone: "bg-amber-500 text-white", title: "Payment cancelled", text: "You cancelled the payment. Your cart is still saved if you want to try again." },
};

// The payment gateway (SSLCommerz / bKash / Nagad...) sends the shopper back here:  /payment/success?order=ORD-123456
export default function PaymentResult({ result }) {
  const meta = META[result];
  const id = useSearchParams().get("order");
  const { user } = useAuth();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    if (!id || !user) return;
    api.getOrder(id).then(setOrder).catch(() => {});
  }, [id, user]);

  const celebrated = useRef(false);   // React StrictMode runs effects twice in dev - celebrate only once
  useEffect(() => { if (result === "success" && !celebrated.current) { celebrated.current = true; celebrateOrder(); } }, [result]);

  if (!meta) return <Missing title="Unknown payment result" />;
  return (
    <div className="mx-auto max-w-md rounded-2xl bg-white p-8 text-center shadow-md ring-1 ring-black/5">
      <span className={`mx-auto grid h-16 w-16 place-items-center rounded-full text-3xl font-bold ${meta.tone}`}>{meta.icon}</span>
      <h2 className="mt-4 font-display text-2xl font-semibold">{meta.title}</h2>
      <p className="mt-1 text-sm text-ink/70">{meta.text}</p>
      {id && (
        <div className="mt-5 rounded-xl bg-cream p-3 text-left text-sm">
          <p>Order ID <b>{id}</b></p>
          {order && <><p>Total <b>{money(order.totals.total)}</b></p><p>Payment <b>{order.payment.method}</b> · {payStatus(order.payment.status)}</p></>}
        </div>
      )}
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {result === "success" && id && <Link href={`/account/orders/${id}`} className="btn">Track my order</Link>}
        {result === "success" && id && <InvoiceButton id={id} className="rounded-lg border border-primary px-4 py-2.5 text-sm font-semibold text-primary" />}
        {result !== "success" && <Link href="/cart" className="btn">Back to cart</Link>}
        <Link href="/account/orders" className="rounded-lg border border-primary px-4 py-2.5 text-sm font-semibold text-primary">My orders</Link>
        <Link href="/shop" className="rounded-lg border border-accent/50 px-4 py-2.5 text-sm">Continue shopping</Link>
      </div>
    </div>
  );
}
