import Head from 'next/head';
import HospitalDashboard from '../../components/hospital/HospitalDashboard';

export default function HospitalBillingPage() {
  return (
    <>
      <Head>
        <title>Billing – MediVault</title>
      </Head>
      <HospitalDashboard defaultTab="billing" />
    </>
  );
}
