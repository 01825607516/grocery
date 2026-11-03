import { categoryImage, categoryFallback } from "./images";

// ---------------------------------------------------------------------------
// NO PRODUCT / OFFER / RECIPE / DELIVERY DATA LIVES HERE ANY MORE: all of it comes from the database (Dokani) through
// /api/dokani/catalog. This file only keeps three small things the database cannot hold:
//   1. CONFIG      - safe default business rules, used only for a setting the shop has not saved yet (the settings table wins)
//   2. CATEGORIES  - the built-in LOOK (icon kind, colour, fallback picture) for well-known category ids. A category image saved in
//                    the database (category_meta.image) always wins over the fallback picture here.
//   3. small UI texts / helpers (STATUS_LABEL, HERO default wording, slug)
// ---------------------------------------------------------------------------
export const FREE_DELIVERY_LIMIT = 1000;
export const SUBSCRIBE_PCT = 5; // "Subscribe & save" discount (%)
export const CONFIG = { freeDeliveryLimit: FREE_DELIVERY_LIMIT, subscribePct: SUBSCRIBE_PCT, leadHours: 1, maxQtyPerLine: 10, deliveryFee: 100 };

export const STATUS_LABEL = { fresh: "Fresh Today", low: "Only 3 Left", near: "Near Expiry", out: "Out of Stock" };

// Colour palette used by the category art
const C = {
  red: "#e5484d", orange: "#f08c3a", yellow: "#f2bf2c", green: "#4fa86b", dgreen: "#2f6b45", lime: "#9acd4f",
  purple: "#7b4fa3", pink: "#ef7fa5", brown: "#8b5a3c", tan: "#d9b38c", cream: "#e8d5aa", blue: "#4a8fe0",
  navy: "#2f4b7c", teal: "#2aa8a0", white: "#c9d6dc", gray: "#8a96a0", gold: "#d4a24c", choco: "#5a3825", coral: "#f2735c", mango: "#f6a21e",
};

export const slug = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// Built-in look of the well-known categories. Dokani category NAMES are matched to these ids in services/dokani/config.js (CATEGORY_RULES).
// A category the shop adds that matches none of them still shows up (generic look): see toCategory() in services/dokani/mapper.js.
export const CATEGORIES = [
  { id: "veg", name: "Vegetables", subs: ["Leafy", "Roots", "Everyday"], kind: "leaf", color: C.green, image: categoryImage("veg"), fallback: categoryFallback("veg") },
  { id: "fruits", name: "Fruits", subs: ["Seasonal", "Tropical"], kind: "fruit", color: C.red, image: categoryImage("fruits"), fallback: categoryFallback("fruits") },
  { id: "meat", name: "Meat & Fish", subs: ["Chicken", "Beef & Mutton", "Fish"], kind: "meat", color: C.coral, image: categoryImage("meat"), fallback: categoryFallback("meat") },
  { id: "dairy", name: "Dairy & Eggs", subs: ["Milk", "Eggs", "Cheese & Butter"], kind: "carton", color: C.blue, image: categoryImage("dairy"), fallback: categoryFallback("dairy") },
  { id: "bakery", name: "Bakery", subs: ["Bread", "Cakes & Treats"], kind: "bread", color: C.tan, image: categoryImage("bakery"), fallback: categoryFallback("bakery") },
  { id: "snacks", name: "Snacks", subs: ["Chips", "Nuts & Dried"], kind: "bag", color: C.yellow, image: categoryImage("snacks"), fallback: categoryFallback("snacks") },
  { id: "drinks", name: "Beverages", subs: ["Juice", "Tea & Coffee", "Soft Drinks"], kind: "bottle", color: C.orange, image: categoryImage("drinks"), fallback: categoryFallback("drinks") },
  { id: "pantry", name: "Pantry", subs: ["Oils", "Honey & Spreads", "Basics"], kind: "jar", color: C.gold, image: categoryImage("pantry"), fallback: categoryFallback("pantry") },
  { id: "grains", name: "Rice & Grains", subs: ["Rice & Flour", "Lentils & Pulses"], kind: "sack", color: C.tan, image: categoryImage("grains"), fallback: categoryFallback("grains") },
  { id: "frozen", name: "Frozen Food", subs: ["Meals", "Ice Cream"], kind: "tub", color: C.blue, image: categoryImage("frozen"), fallback: categoryFallback("frozen") },
  { id: "beauty", name: "Beauty & Care", subs: ["Skin", "Hair & Body"], kind: "tube", color: C.pink, image: categoryImage("beauty"), fallback: categoryFallback("beauty") },
  { id: "home", name: "Household", subs: ["Cleaning", "Kitchen"], kind: "pump", color: C.blue, image: categoryImage("home"), fallback: categoryFallback("home") },
  { id: "spices", name: "Spices & Masala", subs: ["Ground", "Whole"], kind: "jar", color: C.red, image: categoryImage("spices"), fallback: categoryFallback("spices") },
  { id: "noodles", name: "Noodles & Pasta", subs: ["Noodles", "Pasta"], kind: "bowl", color: C.orange, image: categoryImage("noodles"), fallback: categoryFallback("noodles") },
  { id: "sweets", name: "Sweets & Chocolate", subs: ["Chocolate", "Candy & Biscuits"], kind: "bar", color: C.choco, image: categoryImage("sweets"), fallback: categoryFallback("sweets") },
  { id: "breakfast", name: "Breakfast & Cereal", subs: ["Cereal", "Spreads & Mixes"], kind: "box", color: C.gold, image: categoryImage("breakfast"), fallback: categoryFallback("breakfast") },
  { id: "baby", name: "Baby Care", subs: ["Feeding", "Bath & Care"], kind: "bottle", color: C.pink, image: categoryImage("baby"), fallback: categoryFallback("baby") },
  { id: "pet", name: "Pet Care", subs: ["Dogs", "Cats & Others"], kind: "bag", color: C.brown, image: categoryImage("pet"), fallback: categoryFallback("pet") },
  { id: "health", name: "Health & Wellness", subs: ["Vitamins", "Wellness"], kind: "jar", color: C.teal, image: categoryImage("health"), fallback: categoryFallback("health") },
  { id: "hygiene", name: "Personal Hygiene", subs: ["Oral Care", "Body Care"], kind: "tube", color: C.teal, image: categoryImage("hygiene"), fallback: categoryFallback("hygiene") },
];

// Default wording of the home hero. The shop can change it in Admin > Homepage (site_content.hero); this is used only while that is empty.
export const HERO = {
  title: "Grocery Shopping Made Fast, Easy & Affordable",
  text: "Fresh groceries delivered to your door step, anywhere in Bangladesh.",
};
