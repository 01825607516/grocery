// ---------------------------------------------------------------------------
// Dokani Cloud adapter settings. SERVER ONLY: never import anything from services/dokani/ in a "use client" file.
// Credentials come from .env.local WITHOUT the NEXT_PUBLIC_ prefix, so Next.js never sends them to the browser.
// ---------------------------------------------------------------------------
export const cfg = () => ({
  baseUrl: (process.env.DOKANI_BASE_URL || "").replace(/\/$/, ""), // https://app.dokani.cloud/api
  login: process.env.DOKANI_LOGIN || "",                            // the GROCERY shop admin's login (email / phone)
  password: process.env.DOKANI_PASSWORD || "",
  shopId: String(process.env.DOKANI_SHOP_ID || "").trim(),          // safety check only (see client.js assertShop)
  branchId: String(process.env.DOKANI_BRANCH_ID || "").trim(),      // branch used for sales
  bankId: String(process.env.DOKANI_BANK_ID || "").trim(),          // Dokani bank/account ID for non-COD sales
});
export const isEnabled = () => { const c = cfg(); return Boolean(c.baseUrl && c.login && c.password); };

export const TOKEN_TTL_MS = 20 * 60 * 60 * 1000; // refresh a little before the ~22 h token life; a 401 also triggers a fresh login
export const CATALOG_TTL_MS = 60 * 1000;         // products are re-read from Dokani at most once a minute
export const NEAR_EXPIRY_DAYS = 3;               // expiry_date within 3 days -> "Near Expiry" badge

// Dokani categories are free text ("Drinks", "Rice"). Freshly has a fixed list of category ids (src/lib/data.js).
// The Dokani category NAME is matched top to bottom; first match wins. No match -> a new category is created from the name.
// Edit this list when the shop adds new kinds of categories.
export const CATEGORY_RULES = [
  [/veg|sabji|shak/i, "veg"],
  [/fruit/i, "fruits"],
  [/meat|fish|chicken|beef|mutton|egg\b/i, "meat"],
  [/dairy|milk|cheese|butter|yogh?urt/i, "dairy"],
  [/bakery|bread|cake|bun/i, "bakery"],
  [/snack|chips|nuts?/i, "snacks"],
  [/drink|beverage|juice|soda|tea|coffee|water/i, "drinks"],
  [/rice|grain|flour|atta|lentil|dal\b|pulse/i, "grains"],
  [/spice|masala/i, "spices"],
  [/noodle|pasta/i, "noodles"],
  [/sweet|chocolate|candy|biscuit/i, "sweets"],
  [/breakfast|cereal|oats/i, "breakfast"],
  [/frozen|ice.?cream/i, "frozen"],
  [/beauty|skin|hair|cosmetic/i, "beauty"],
  [/baby|diaper/i, "baby"],
  [/pet\b|dog|cat\b/i, "pet"],
  [/health|vitamin|wellness|medicine/i, "health"],
  [/hygiene|soap|toothpaste|oral|shampoo/i, "hygiene"],
  [/home|house|clean|kitchen|detergent/i, "home"],
  [/pantry|oil|sugar|salt|honey|ghee/i, "pantry"],
];

// Freshly sells by "kg" (decimal quantities) or "pc". Dokani unit names that mean weight are listed here; everything else is "pc".
export const KG_UNITS = /^(kg|kgs|kilo|kilogram|kilograms|gm|gram|grams|g)\.?$/i;
