"use client";
import PageShell from "@/components/layout/PageShell";
import OrdersView from "@/components/pages/OrdersView";
import { AuthGate, Crumbs } from "@/components/pages/common";

export default function OrdersPage() {
  return (
    <PageShell title="My orders">
      <AuthGate why="Please log in to see your orders.">
        <Crumbs items={[{ href: "/", label: "Home" }, { href: "/account", label: "Account" }, { label: "Orders" }]} />
        <OrdersView />
      </AuthGate>
    </PageShell>
  );
}
