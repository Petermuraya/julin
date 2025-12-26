import dynamic from 'next/dynamic';
const AdminDashboard = dynamic(() => import('../../src/pages/admin/AdminDashboard'), { ssr: false });

export default function Page() {
  return <AdminDashboard />;
}
