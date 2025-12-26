import dynamic from 'next/dynamic';
const AdminChatDashboard = dynamic(() => import('../../src/pages/admin/AdminChatDashboard'), { ssr: false });

export default function Page() {
  return <AdminChatDashboard />;
}
