import { useRouter } from 'next/router';
import DoctorConsultation from '../../components/doctor/DoctorConsultation';
import Layout from '../../components/layout/Layout';

export default function DoctorConsultationPage() {
  const router = useRouter();
  const { appointmentId } = router.query;
  return (
    <Layout>
      <DoctorConsultation appointmentId={appointmentId} />
    </Layout>
  );
}
