"use client";
import PageShell from "@/components/layout/PageShell";
import ProductCard from "@/components/product/ProductCard";
import WishExtras from "@/components/product/WishExtras";
import { AuthGate, EmptyState } from "@/components/pages/common";
import { useCart } from "@/context/CartContext";
import { useCatalog } from "@/context/CatalogContext";

export default function WishlistPage() {
  const { products } = useCatalog();
  const { isWished, wishlist, addMany } = useCart();
  const list = products.filter((p) => isWished(p.id));
  return (
    <PageShell title="Your wishlist">
      <AuthGate why="Please log in to see your wishlist.">
        {!list.length ? <EmptyState title="Nothing saved yet" text="Tap the heart on any product to save it for later." /> : (
          <>
            <div className="mb-3 flex items-center justify-between text-sm"><p className="text-ink/70"><b className="text-ink">{wishlist.length}</b> {wishlist.length === 1 ? "saved item" : "saved items"}</p><button onClick={(e) => addMany(list, "wishlist items", e.currentTarget)} className="btn !py-1.5">Add all to cart</button></div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">{list.map((p) => <div key={p.id}><ProductCard product={p} compact /><WishExtras p={p} /></div>)}</div>
          </>
        )}
      </AuthGate>
    </PageShell>
  );
}
