import Head from 'next/head';
import AdminAnnouncements from '../../components/admin/AdminAnnouncements';

export default function AdminAnnouncementsPage() {
  return (
    <>
      <Head><title>Announcements – Admin – MediVault</title></Head>
      <AdminAnnouncements />
    </>
  );
}
