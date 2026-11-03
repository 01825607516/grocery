import { NextResponse } from "next/server";
import { clearStoreCache } from "@/services/dokani/storefront";
import { clearCatalogCache } from "@/services/dokani/catalog";

// Called by the admin panel after every save. The storefront keeps shop settings / offers / delivery areas in memory for about a
// minute; this forgets them so the website shows the change on the next page load. It only clears caches (nothing is read or
// written), and repeated calls within 2 seconds are ignored.
export const dynamic = "force-dynamic";
let last = 0;

export async function POST() {
  if (Date.now() - last > 2000) { last = Date.now(); clearStoreCache(); clearCatalogCache(); }
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
