import { NextResponse } from "next/server";
import { clearStoreCache } from "@/services/dokani/storefront";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) return NextResponse.json({ message: "Invalid request origin." }, { status: 403 });
  const cookie = request.headers.get("cookie");
  if (!cookie) return NextResponse.json({ message: "Administrator session required." }, { status: 401 });
  const adminOrigin = (process.env.DOKANI_ADMIN_ORIGIN || "http://localhost:8000").replace(/\/$/, "");
  try {
    const check = await fetch(`${adminOrigin}/admin/api/me`, { headers: { Accept: "application/json", Cookie: cookie }, cache: "no-store", signal: AbortSignal.timeout(8000) });
    if (!check.ok) return NextResponse.json({ message: "Administrator session required." }, { status: 401 });
    clearStoreCache();
    return NextResponse.json({ revalidated: true });
  } catch {
    return NextResponse.json({ message: "Could not refresh the public storefront cache." }, { status: 503 });
  }
}