import dynamic from 'next/dynamic';
const AdminLogin = dynamic(() => import('../../src/pages/admin/AdminLogin'), { ssr: false });

export default function Page() {
  return <AdminLogin />;
}
