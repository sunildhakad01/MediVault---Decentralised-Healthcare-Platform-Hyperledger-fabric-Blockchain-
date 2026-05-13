import Head from 'next/head';
import HospitalDashboard from '../../components/hospital/HospitalDashboard';

export default function HospitalBedsPage() {
  return (
    <>
      <Head>
        <title>Beds & Admissions – MediVault</title>
      </Head>
      <HospitalDashboard defaultTab="beds" />
    </>
  );
}
