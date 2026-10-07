"use client";
import PageShell from "@/components/layout/PageShell";
import AccountView from "@/components/pages/AccountView";
import { AuthGate } from "@/components/pages/common";

export default function AccountPage() {
  return <PageShell title="My account"><AuthGate why="Please log in to see your account."><AccountView /></AuthGate></PageShell>;
}
