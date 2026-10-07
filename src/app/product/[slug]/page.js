import ProductPage from "@/components/pages/ProductPage";

export default function Page({ params }) {
  return <ProductPage slug={params.slug} />;
}
