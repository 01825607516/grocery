"use client";
import Header from "@/components/layout/Header";
import Invoice from "@/components/pages/Invoice";
import { AuthGate } from "@/components/pages/common";

// No footer / cart here so the printed invoice is clean (the header is hidden when printing).
export default function InvoicePage({ params }) {
  return (
    <>
      <div className="print:hidden"><Header /></div>
      <main className="container-x py-6 md:py-8 print:p-0"><AuthGate why="Please log in to see your invoice."><Invoice id={decodeURIComponent(params.id)} /></AuthGate></main>
    </>
  );
}
