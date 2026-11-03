import AdminPanel from "@/components/admin/AdminPanel";

export const metadata = { title: "Website management", robots: { index: false, follow: false } };

// The admin panel. Sign-in happens with the website's normal login form (see AuthContext); this page only shows the panel
// once an administrator is signed in. Data comes from the Laravel backend through the /admin/api rewrites in next.config.js.
export default function AdminPage() {
  return <AdminPanel />;
}
