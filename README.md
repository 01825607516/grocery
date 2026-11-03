# Freshly – Grocery Store (Next.js + Tailwind, JavaScript)

1. `npm install`
2. `npm run dev`  → http://localhost:3000   (needs internet: product/category/banner photos load from remote URLs)

## Images (no downloading needed)
- Every product, category and campaign has an `image` URL (+ a `fallback` URL) in `src/lib/data.js`; the dummy URLs are built in `src/lib/images.js`.
- To use your database / API images later: set `image` on the item (e.g. `image: row.image_url`) or change the helpers in `images.js`.
- Wrong photo for one product? In `images.js` put an Unsplash photo id into `UNSPLASH_PRODUCTS` (`"Mango": "<photo-id>"`) or change its word in `PRODUCT_KEYWORDS`.
- If a remote image fails to load, `Art.js` tries `fallback`, then shows a plain tinted tile.
- Offer banners come from the database (campaigns saved in Admin > Offers & campaigns): photo + discount + countdown, brand gradient behind if the photo fails.
- Brand logos: `public/brands/<brand-slug>.svg` (served by the app itself, always loads). Regenerate: `node scripts/make-logos.mjs`, or drop in your own .svg/.png with the same name.


## Login rules, backend and testing
- Guests can browse everything (categories, brands, offers, search, quick view). Add to cart, wishlist, reorder, coupon and checkout need login; after logging in, the action the guest wanted runs automatically.
- All data comes from the DATABASE (Dokani) through `src/services/` (`api`) and our own server routes `/api/dokani/catalog` and `/api/shop/*`. There is NO mock / demo data any more: whatever the shop has not filled in (offers, recipes, delivery areas...) is simply empty and its section hides. To see where each part of the store comes from (or why it is empty), open `/api/dokani/catalog` in the browser and read `storeFrom` (values: `dokani`, `empty (...)`, `error: ...`).
- Business rules (pricing, free delivery, slots, stock caps, recommendations) are plain functions in `src/lib/` (`pricing.js`, `delivery.js`, `recommend.js`, `format.js`).
- Footer pages (Help, Delivery info, Return & Refund, Privacy, Terms…) are in `src/lib/info.js` – the Return / Privacy / Terms text is a DRAFT, replace with the real policy.
