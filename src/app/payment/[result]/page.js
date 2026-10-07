"use client";
import { Suspense } from "react";
import PageShell from "@/components/layout/PageShell";
import PaymentResult from "@/components/pages/PaymentResult";

export default function PaymentPage({ params }) {
  return <PageShell title="Payment" narrow><Suspense fallback={null}><PaymentResult result={params.result} /></Suspense></PageShell>;
}
