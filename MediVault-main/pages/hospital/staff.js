import Head from 'next/head';
import HospitalDashboard from '../../components/hospital/HospitalDashboard';

export default function HospitalStaffPage() {
  return (
    <>
      <Head>
        <title>Staff – MediVault</title>
      </Head>
      <HospitalDashboard defaultTab="staff" />
    </>
  );
}
