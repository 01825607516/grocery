 "use client";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/sections/Hero";
import ShopByCategory from "@/components/sections/ShopByCategory";
import ShopSection from "@/components/sections/ShopSection";
import ShopByBrand from "@/components/sections/ShopByBrand";
import TopSaver from "@/components/sections/TopSaver";
import Recommendations from "@/components/sections/Recommendations";
import SmartShopping from "@/components/sections/SmartShopping";
import { useCatalog } from "@/context/CatalogContext";
import { HOME_SECTIONS, mergeSections } from "@/lib/theme";
import MiniCart from "@/components/cart/MiniCart";
import CartDrawer from "@/components/cart/CartDrawer";
import SmartListModal from "@/components/list/SmartListModal";

// One long page. Scroll and you see every section in order; click a nav link and it scrolls to that section.
// Each section is compact enough to fit in one screen, with the same clear gap (py-6 / md:py-8 + a thin line) above and below,
// so sections never touch and the visitor scrolls as little as possible. Phones can still be taller than one screen.
// Website Management > Home layout can hide these sections or change their order (site_content.layout).
const NODES = {
  categories: <ShopByCategory key="c" />,
  shop: <ShopSection key="s" />,
  "top-saver": <TopSaver key="t" />,
  recommended: <Recommendations key="r" />,
  reorder: <SmartShopping key="o" />,
};

export default function Home() {
  const { siteContent, featureToggles = {} } = useCatalog();
  const layout = siteContent?.layout || {};
  const order = mergeSections(layout.sections).filter((s) => s.show && (s.id !== "reorder" || featureToggles.buy_again !== false || featureToggles.recipes !== false) && (s.id !== "recommended" || featureToggles.recommendations !== false));
  return (
    <>
      <Header />
      <main>
        {layout.hero !== false && <Hero />}
        {order.map(({ id }) => (id === "brands" ? <ShopByBrand key={id} /> : (
          <div key={id} id={id} className="border-t border-accent/25 py-6 md:py-8">
            {NODES[id]}
          </div>
        )))}
      </main>
      <Footer />
      {featureToggles.mini_cart !== false && <><MiniCart /><CartDrawer /></>}
      {featureToggles.smart_grocery_list !== false && <SmartListModal />}
    </>
  );
}