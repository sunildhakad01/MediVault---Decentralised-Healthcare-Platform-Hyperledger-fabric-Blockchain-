import Head from 'next/head';
import HospitalDashboard from '../../components/hospital/HospitalDashboard';

export default function HospitalDashboardPage() {
  return (
    <>
      <Head>
        <title>Hospital Dashboard – MediVault</title>
      </Head>
      <HospitalDashboard />
    </>
  );
}
