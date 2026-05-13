import { useEffect } from "react";
import { useRouter } from "next/router";
import AdminDashboard from "../../components/admin/AdminDashboard";

export default function AdminDashboardPage() {
  const router = useRouter();

  useEffect(() => {
    const session = localStorage.getItem("mv_admin_session");
    if (!session) {
      router.replace("/admin/login");
    }
  }, [router]);

  return <AdminDashboard />;
}
