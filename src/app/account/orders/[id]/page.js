"use client";
import PageShell from "@/components/layout/PageShell";
import OrderDetail from "@/components/pages/OrderDetail";
import { AuthGate } from "@/components/pages/common";

export default function OrderPage({ params }) {
  return <PageShell title="Order details"><AuthGate why="Please log in to see this order."><OrderDetail id={decodeURIComponent(params.id)} /></AuthGate></PageShell>;
}
