import { useEffect } from "react";
import { useRouter } from "next/router";
import AdminProfile from "../../components/admin/AdminProfile";

export default function AdminProfilePage() {
  const router = useRouter();

  useEffect(() => {
    const session = localStorage.getItem("mv_admin_session");
    if (!session) router.replace("/admin/login");
  }, [router]);

  return <AdminProfile />;
}
