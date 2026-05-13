import Head from 'next/head';
import DoctorAvailability from '../../components/doctor/DoctorAvailability';

export default function DoctorAvailabilityPage() {
  return (
    <>
      <Head><title>Availability – Doctor – MediVault</title></Head>
      <DoctorAvailability />
    </>
  );
}
