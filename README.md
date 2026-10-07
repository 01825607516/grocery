# Freshly – Grocery Store (Next.js + Tailwind, JavaScript)

1. `npm install`
2. `npm run dev`  → http://localhost:3000   (needs internet: product/category/banner photos load from remote URLs)

## Images (no downloading needed)
- Every product, category and campaign has an `image` URL (+ a `fallback` URL) in `src/lib/data.js`; the dummy URLs are built in `src/lib/images.js`.
- To use your database / API images later: set `image` on the item (e.g. `image: row.image_url`) or change the helpers in `images.js`.
- Wrong photo for one product? In `images.js` put an Unsplash photo id into `UNSPLASH_PRODUCTS` (`"Mango": "<photo-id>"`) or change its word in `PRODUCT_KEYWORDS`.
- If a remote image fails to load, `Art.js` tries `fallback`, then shows a plain tinted tile.
- Offer banners: `CAMPAIGNS` in data.js (photo + discount + countdown, brand gradient behind if the photo fails).
- Brand logos: `public/brands/<brand-slug>.svg` (served by the app itself, always loads). Regenerate: `node scripts/make-logos.mjs`, or drop in your own .svg/.png with the same name.


## Login rules, backend and testing
- Guests can browse everything (categories, brands, offers, search, quick view). Add to cart, wishlist, reorder, coupon and checkout need login; after logging in, the action the guest wanted runs automatically.
- All data goes through `src/services/` (`api`). With `NEXT_PUBLIC_API_URL` empty the app uses a browser-only mock (try: register any number like 01712345678 – a new account gets one sample past order; coupons `FRESH10`, `WELCOME50`; orders move through tracking every ~25 s). Set `NEXT_PUBLIC_API_URL` to use the real API. Endpoints and JSON shapes: `API_CONTRACT.md`.
- Business rules (pricing, free delivery, slots, stock caps, recommendations) are plain functions in `src/lib/` (`pricing.js`, `delivery.js`, `recommend.js`, `format.js`).
- Footer pages (Help, Delivery info, Return & Refund, Privacy, Terms…) are in `src/lib/info.js` – the Return / Privacy / Terms text is a DRAFT, replace with the real policy.
