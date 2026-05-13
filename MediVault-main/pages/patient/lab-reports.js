import PatientLabReports from '../../components/patient/PatientLabReports';
import Layout from '../../components/layout/Layout';

export default function PatientLabReportsPage() {
  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <PatientLabReports />
      </div>
    </Layout>
  );
}
