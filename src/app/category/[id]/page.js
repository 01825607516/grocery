import CategoryPage from "@/components/pages/CategoryPage";

export default function Page({ params }) {
  return <CategoryPage id={params.id} />;
}
