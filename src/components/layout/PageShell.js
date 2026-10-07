"use client";
import Header from "./Header";
import Footer from "./Footer";
import MiniCart from "@/components/cart/MiniCart";
import CartDrawer from "@/components/cart/CartDrawer";
import SectionHeading from "@/components/ui/SectionHeading";

// Frame for every inner page: same header + footer + cart drawer as the home page.
// title  -> the green pill heading used on the home page sections
// narrow -> reading width for text pages and forms
// bare   -> no mini cart / drawer (checkout page)
export default function PageShell({ title, children, narrow = false, bare = false }) {
  return (
    <>
      <Header />
      <main className="container-x min-h-[60vh] py-6 md:py-8">
        {title && <SectionHeading title={title} />}
        <div className={narrow ? "mx-auto max-w-3xl" : ""}>{children}</div>
      </main>
      <Footer />
      {!bare && <><MiniCart /><CartDrawer /></>}
    </>
  );
}
