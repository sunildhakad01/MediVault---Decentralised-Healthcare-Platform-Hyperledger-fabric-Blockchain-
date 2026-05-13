import Head from 'next/head';
import HospitalDashboard from '../../components/hospital/HospitalDashboard';

export default function HospitalLabPage() {
  return (
    <>
      <Head>
        <title>Lab – MediVault</title>
      </Head>
      <HospitalDashboard defaultTab="lab" />
    </>
  );
}
