import { Playfair_Display, Source_Sans_3, Cormorant_Garamond } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import { CatalogProvider } from "@/context/CatalogContext";
import { CartProvider } from "@/context/CartContext";
import { ReviewProvider } from "@/context/ReviewContext";
import AuthModal from "@/components/auth/AuthModal";
import AccountModal from "@/components/auth/AccountModal";
import ProductModal from "@/components/product/ProductModal";
import Toast from "@/components/ui/Toast";
import StoreTheme from "@/components/layout/StoreTheme";
import { I18nProvider } from "@/context/I18nContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { getStoreSEO } from "@/services/dokani/storefront";
import "./globals.css";

// Runs before first paint so the saved / system theme is applied without a flash (same logic as ThemeContext).
const THEME_SCRIPT = `try{var t=localStorage.getItem("gs_theme")||(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");document.documentElement.classList.toggle("dark",t==="dark")}catch(e){}`;

const display = Playfair_Display({ subsets: ["latin"], variable: "--font-display", display: "swap" });
const hero = Cormorant_Garamond({ subsets: ["latin"], weight: ["500", "600", "700"], style: ["normal", "italic"], variable: "--font-hero", display: "swap" });
const body = Source_Sans_3({ subsets: ["latin"], variable: "--font-body", display: "swap" });

export async function generateMetadata() {
  const fallback = { title: "Fresh Organic Market", description: "Fresh groceries delivered to your door" };
  try {
    const settings = await getStoreSEO();
    const seo = settings?.seo || {};
    const language = settings?.language === "bn" ? "bn" : "en";
    const localized = seo[language] || {};
    const title = String(localized.title || "").trim() || fallback.title;
    const description = String(localized.description || "").trim() || fallback.description;
    const keywords = String(localized.keywords || "").trim();
    const image = String(seo.og_image || "").trim();
    const favicon = String(settings?.faviconUrl || "").trim();
    return {
      title,
      description,
      ...(keywords ? { keywords } : {}),
      ...(favicon ? { icons: { icon: favicon, shortcut: favicon } } : {}),
      openGraph: { title, description, ...(image ? { images: [image] } : {}) },
      twitter: { card: image ? "summary_large_image" : "summary", title, description, ...(image ? { images: [image] } : {}) },
    };
  } catch {
    return fallback;
  }
}
export const viewport = { themeColor: "#1f4d3a" };

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${display.variable} ${body.variable} ${hero.variable}`}>
      <head><script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} /></head>
      <body>
       <ThemeProvider>
        <I18nProvider>
        <AuthProvider>
          <CatalogProvider>
            <StoreTheme />
            <CartProvider>
             <ReviewProvider>
              {children}
              <ProductModal />
              <AccountModal />
              <AuthModal />
              <Toast />
             </ReviewProvider>
            </CartProvider>
          </CatalogProvider>
        </AuthProvider>
        </I18nProvider>
       </ThemeProvider>
      </body>
    </html>
  );
}
