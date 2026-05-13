import Head from 'next/head';
import HospitalDashboard from '../../components/hospital/HospitalDashboard';

export default function HospitalProfilePage() {
  return (
    <>
      <Head>
        <title>Hospital Profile – MediVault</title>
      </Head>
      <HospitalDashboard defaultTab="profile" />
    </>
  );
}
