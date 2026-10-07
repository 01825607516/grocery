import { slug } from "./data";

// /product/12-tomato  (the number is the product id, the rest is just for nice URLs)
export const productHref = (p) => `/product/${p.id}-${slug(p.name)}`;
export const productIdFromSlug = (s) => parseInt(String(s), 10);

// Footer / policy pages (the text itself stays in lib/info.js)
export const INFO_ROUTES = {
  "help-center": "Help Center",
  contact: "Contact",
  "delivery-information": "Delivery Information",
  "return-policy": "Return & Refund",
  about: "About",
  careers: "Careers",
  privacy: "Privacy Policy",
  terms: "Terms & Conditions",
};