import Head from 'next/head';
import DoctorLabOrders from '../../components/doctor/DoctorLabOrders';

export default function DoctorLabOrdersPage() {
  return (
    <>
      <Head><title>Lab Orders – Doctor – MediVault</title></Head>
      <DoctorLabOrders />
    </>
  );
}
