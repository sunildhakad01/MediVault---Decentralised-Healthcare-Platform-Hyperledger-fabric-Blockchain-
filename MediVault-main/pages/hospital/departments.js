import Head from 'next/head';
import HospitalDashboard from '../../components/hospital/HospitalDashboard';

export default function HospitalDepartmentsPage() {
  return (
    <>
      <Head>
        <title>Departments – MediVault</title>
      </Head>
      <HospitalDashboard defaultTab="departments" />
    </>
  );
}
