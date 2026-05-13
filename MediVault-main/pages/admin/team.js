import { useEffect } from "react";
import { useRouter } from "next/router";
import AdminTeam from "../../components/admin/AdminTeam";

export default function AdminTeamPage() {
  const router = useRouter();

  useEffect(() => {
    const session = localStorage.getItem("mv_admin_session");
    if (!session) router.replace("/admin/login");
  }, [router]);

  return <AdminTeam />;
}
