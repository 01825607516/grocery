import { NextResponse } from "next/server";
import { getCatalog } from "@/services/dokani/catalog";
import { isEnabled } from "@/services/dokani/config";
import { getStoreExtras } from "@/services/dokani/storefront";

// The browser calls THIS route; only the server talks to Dokani, so the shop password and token never reach the browser.
export const dynamic = "force-dynamic";

export async function GET() {
  if (!isEnabled()) return NextResponse.json({ message: "Dokani is not configured on the server (.env.local)." }, { status: 503 });
  try {
    const [catalog, extras] = await Promise.all([getCatalog(), getStoreExtras().catch(() => null)]);
    // delivery areas / time slots / offers / free-delivery limit also come from Dokani (each part falls back to the demo data when the shop has not filled it in)
    const more = extras ? { areas: extras.areas, slots: extras.slots, payments: extras.payments, config: extras.config, offers: extras.offers, recipes: extras.recipes, siteContent: extras.siteContent, support: extras.support, storeFrom: extras.from } : {};
    return NextResponse.json({ ...catalog, ...more }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("[dokani catalog]", e?.message || e);
    const why = process.env.NODE_ENV !== "production" && e?.message ? ` (${e.message})` : ""; // the real reason is shown only while developing
    return NextResponse.json({ message: `Could not load products from Dokani. Please try again.${why}` }, { status: 502 });
  }
}
