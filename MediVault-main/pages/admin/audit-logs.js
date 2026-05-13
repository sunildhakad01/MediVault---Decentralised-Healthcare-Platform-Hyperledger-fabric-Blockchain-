import { useEffect } from "react";
import { useRouter } from "next/router";
import AdminAuditLogs from "../../components/admin/AdminAuditLogs";

export default function AdminAuditLogsPage() {
  const router = useRouter();

  useEffect(() => {
    const session = localStorage.getItem("mv_admin_session");
    if (!session) router.replace("/admin/login");
  }, [router]);

  return <AdminAuditLogs />;
}
