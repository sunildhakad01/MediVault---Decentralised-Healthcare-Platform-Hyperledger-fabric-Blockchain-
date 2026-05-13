import Head from 'next/head';
import HospitalDashboard from '../../components/hospital/HospitalDashboard';

export default function HospitalDoctorsPage() {
  return (
    <>
      <Head>
        <title>Doctors – MediVault</title>
      </Head>
      <HospitalDashboard defaultTab="doctors" />
    </>
  );
}
