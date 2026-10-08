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
import MiniCart from "@/components/cart/MiniCart";
import CartDrawer from "@/components/cart/CartDrawer";
import SmartListModal from "@/components/list/SmartListModal";

// One long page. Scroll and you see every section in order; click a nav link and it scrolls to that section.
// Each section is compact enough to fit in one screen, with the same clear gap (py-6 / md:py-8 + a thin line) above and below,
// so sections never touch and the visitor scrolls as little as possible. Phones can still be taller than one screen.
const SECTIONS = [
  ["categories", <ShopByCategory key="c" />],
  ["shop", <ShopSection key="s" />],
  ["top-saver", <TopSaver key="t" />],
  ["recommended", <Recommendations key="r" />],
  ["reorder", <SmartShopping key="o" />],
];

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        {SECTIONS.map(([id, node]) => (
          <div key={id} id={id} className="border-t border-accent/25 py-6 md:py-8">
            {node}
          </div>
        ))}
        <ShopByBrand />
      </main>
      <Footer />
      <MiniCart />
      <CartDrawer />
      <SmartListModal />
    </>
  );
}