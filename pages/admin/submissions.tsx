import dynamic from 'next/dynamic';
const AdminSubmissions = dynamic(() => import('../../src/pages/admin/AdminSubmissions'), { ssr: false });

export default function Page() {
  return <AdminSubmissions />;
}
