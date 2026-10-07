const items = [["🚚", "Fastest delivery", "Delivery to your door step"], ["☎️", "24x7 service", "Reach us when needed"], ["✅", "Verified brands", "Guaranteed products"], ["🛡", "100% assurance", "We stand by every order"]];
export default function TrustBar() {
  return (
    <section className="container-x grid grid-cols-2 gap-6 py-8 text-center md:grid-cols-4">
      {items.map(([icon, t, d]) => (
        <div key={t}><div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-white text-3xl shadow">{icon}</div><h4 className="mt-2 font-semibold">{t}</h4><p className="text-xs text-ink/60">{d}</p></div>
      ))}
    </section>
  );
}
