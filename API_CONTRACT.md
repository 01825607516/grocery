 # Freshly – API contract (frontend ⇄ backend)

The frontend already works end-to-end against a **mock backend** (`src/services/mockApi.js`, data kept in the browser).
Every screen talks to ONE object: `api` from `src/services/index.js`. The real backend is `src/services/httpApi.js`.

**To connect:** set `NEXT_PUBLIC_API_URL=https://…/v1` in `.env.local` → the app switches to `httpApi.js` automatically.
If the supervisor's paths / field names differ, change them **only** in `src/services/httpApi.js` (top: `toProduct`, `toCategory`, `toUser`).

* JSON in / out. Authenticated calls send `Authorization: Bearer <token>`.
* Errors: HTTP 4xx/5xx with `{ "message": "human readable text" }` – the UI shows `message` as-is. `401` on an authenticated call logs the user out and opens the login popup.
* Money = whole taka (integers). Quantity: `pc` items = integer, `kg` items = multiples of 0.5.

## Who needs login
| Public (guest can use) | Login required |
|---|---|
| catalog, categories, products, offers, recipes, delivery options, config | cart, wishlist, addresses, coupon validation, place order, orders / tracking |

The UI asks a guest to log in when they press **Add**, the wishlist heart, **Reorder**, **Checkout**; the action then continues automatically after login.

## 1. Auth
| Method & path | Body | Response |
|---|---|---|
| `POST /auth/register` | `{ name, email, password }` | `{ token, user: { id, name, email } }` (409 if email exists, 422 validation) |
| `POST /auth/login` | `{ email, password }` | `{ token, user }` (401 wrong credentials) |
| `GET /auth/me` | – | `user` |
| `POST /auth/logout` | – | 204 |

Login uses **email + password** (email is trimmed and lower-cased). A phone number is only asked at checkout for bKash / Nagad.

## 2. Catalog (public)
| Path | Response |
|---|---|
| `GET /categories` | `[{ id, name, subs: ["Leafy", …], image }]` |
| `GET /products` | `[{ id, name, brand, category (category id), sub, price, mrp, unit: "kg"\|"pc", stock (number\|null), status ("fresh"\|"near"\|null), image, subscribable (bool) }]` – `stock: 0` ⇒ Out of Stock, `stock ≤ 3` ⇒ "Only 3 Left" and the UI caps quantity at `stock`. `discount` is computed if omitted. Return all products (the UI filters / paginates). |
| `GET /offers` | `{ live: [{ id, title, image, bg, cats: [categoryId] }], upcoming: [{ id, title, image, bg, startsAt (ISO date, preferred) \| startsInHours }] }` – `live` offers end Saturday 23:59 (shown with a countdown) |
| `GET /recipes` | `[{ name, image?, items: ["Product name", …] }]` |
| `GET /delivery/options` | `{ areas: [{ id, name, charge, express (bool), expressCharge, courier (bool), eta? }], slots: [{ id, label, startHour (0-23), disabled (bool = fully booked) }] }` – `courier: true` areas have no time slots and show `eta` |
| `GET /config` | `{ freeDeliveryLimit, subscribePct, leadHours, payments: ["Cash on Delivery","bKash","Nagad","Card"] }` |

## 3. Cart & wishlist (login)
| Path | Notes |
|---|---|
| `GET /cart` / `PUT /cart` | `{ items: { "<productId>": qty }, subscribed: [productId], substitutions: { "<productId>": "brand"\|"remove"\|"call" } }` – PUT replaces the whole cart (debounced, ~0.5 s after each change) |
| `GET /wishlist` | `{ productIds: [] }` |
| `PUT /wishlist/:productId` / `DELETE /wishlist/:productId` | → `{ productIds: [] }` |

## 4. Addresses (login)
`GET /addresses` → `[{ id, type: "Home"|"Office", line, areaId }]` · `POST /addresses` · `PUT /addresses/:id` · `DELETE /addresses/:id`

## 5. Coupon (login)
`POST /coupons/validate` `{ code, subtotal }` (subtotal after subscribe discount) →
`{ code, type: "percent"|"flat", value, max?, min?, label? }`. Invalid → 404 `{message:"This coupon code is not valid."}`; below minimum → 422 with message.
The UI computes the discount from the rule (percent of subtotal, capped by `max`, ignored below `min`); the backend must recompute on order.

## 6. Orders (login)
`POST /orders`
```json
{
  "items": [{ "productId": 12, "qty": 1.5, "subscribe": false, "substitution": "brand" }],
  "address": { "type": "Home", "line": "House 12, Road 5, Dhanmondi" },
  "areaId": "dhaka",
  "method": "standard",                       // or "express"
  "slot": { "id": "s3", "day": "today" },     // null for express and courier areas; day: "today"|"tomorrow"
  "payment": { "method": "bKash", "phone": "01712345678" },   // phone only for bKash / Nagad
  "couponCode": "FRESH10"
}
```
Response = the order:
```json
{ "id": "ORD-123456", "createdAt": 1767690000000, "status": "confirmed",
  "items": [{ "productId": 12, "name": "Tomato", "unit": "kg", "price": 60, "qty": 1.5, "total": 90, "subscribe": false, "substitution": "brand" }],
  "address": { "type": "Home", "line": "…" },
  "delivery": { "method": "standard", "areaId": "dhaka", "areaName": "Inside Dhaka City", "slot": { "id": "s3", "label": "4 – 6 PM", "day": "today", "date": "2026-10-06" }, "eta": "" },
  "payment": { "method": "bKash", "phone": "017…", "status": "pending" },
  "coupon": "FRESH10",
  "totals": { "subtotal": 0, "subDiscount": 0, "couponDiscount": 0, "delivery": 0, "free": false, "savings": 0, "total": 0 },
  "paymentUrl": "https://gateway/…" }       // optional: if present the UI redirects there (card / wallet gateway)
```
`GET /orders` → newest first. `GET /orders/:id` → one order. `status` is one of `confirmed → preparing → packed → out_for_delivery → delivered` (also `cancelled`). The UI polls every 4–5 s while an order is active.

**The backend must re-check on `POST /orders`** (the UI checks are only for friendliness): product exists and is in stock, `qty ≤ stock`, area / express allowed, slot still free, coupon valid, payment fields, and **recompute totals** with the same rules as `src/lib/pricing.js`:
`subtotal = Σ round(price × qty)` · subscribe discount = `subscribePct %` of eligible (`subscribable`) subscribed lines · coupon on (subtotal − subscribe discount) · delivery = free if subtotal ≥ `freeDeliveryLimit` and method is standard, otherwise `area.charge (+ area.expressCharge for express)`.
Return 422 `{message}` for any failure (e.g. "Tomato is out of stock").

## Not in the frontend (backend to-do)
Payment gateway for bKash / Nagad / Card (return `paymentUrl`), SMS/OTP, subscription scheduling for "Subscribe & save" lines, rider / warehouse status updates, "frequently bought together" ranking (the app currently ranks from the user's own orders, viewed items and cart – `src/lib/recommend.js`).


## Reviews

- `GET /products/:id/reviews` (public) -> `[{ id, userId?, name, rating (1-5), text, createdAt (ms or ISO), verified?, helpful?, voted? }]`, newest first. `name` should already be short ("Rahim U.").
  `verified` = true when that customer has a non-cancelled order containing the product (UI shows a "Verified purchase" badge). `helpful` = number of "Helpful" votes. `voted` = true if the logged-in caller already voted (optional). `userId` lets the UI mark "(You)" and hide the vote button on own review.
- `POST /products/:id/reviews` (login required) body `{ rating: 1-5, text? (max 500) }` -> the saved review. One review per customer per product: posting again updates it.
  Recommended: server only accepts it from customers who have a delivered order containing that product, and may hold new reviews for moderation.
- `POST /products/:id/reviews/:reviewId/helpful` (login required) toggles the caller's "Helpful" vote -> the updated review. A customer cannot vote on their own review (422).
- Optional on each product in `GET /products`: `rating` (average), `reviewCount`, `reviews` (latest few). If sent, cards show the rating without extra requests.


## Account & order actions (used by the frontend)

- `PUT /auth/profile` body `{ name }` (login required) -> `user`.
- `POST /auth/password` body `{ current, next }` (login required) -> 204. Wrong `current` -> 422 `{message}`.
- `POST /orders/:id/cancel` (login required) -> the updated order with `status: "cancelled"`. Allowed only while status is `confirmed` or `preparing`; otherwise 422 `{message: "This order is already packed and cannot be cancelled. Please call us."}`.
- `POST /orders/:id/return` body `{ reason, note? }` (login required) -> the updated order with `returnRequest: { reason, note, at }`. Only for `delivered` orders, one request per order (409 if repeated, 422 if reason is empty).
- Payment gateway redirect: after online payment the gateway must send the shopper to `/payment/success?order=ORD-123456`, `/payment/fail?order=...` or `/payment/cancel?order=...` on the frontend.

## Added with the smart features (all optional)
- **Products**: an optional `soldToday` number per product. When present, the home row becomes "Most bought today" sorted by it.
- **Price alerts**: `POST /products/:id/price-alert` and `DELETE /products/:id/price-alert` (the UI keeps these per browser until the API exists). Back-in-stock keeps using `POST /products/:id/notify`.
- **Recipes**: `GET /recipes` shape is unchanged. Smart search, "Complete your meal" in the cart and the recipe servings stepper all read it.
- Smart grocery list words (Banglish / Bangla -> product words) live in `src/lib/shopping.js` (`ALIAS`).
