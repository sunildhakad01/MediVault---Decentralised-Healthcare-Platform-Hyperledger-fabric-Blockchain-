import Head from 'next/head';
import HospitalDashboard from '../../components/hospital/HospitalDashboard';

export default function HospitalNotificationsPage() {
  return (
    <>
      <Head>
        <title>Notifications – MediVault</title>
      </Head>
      <HospitalDashboard defaultTab="notifications" />
    </>
  );
}
