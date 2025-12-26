import dynamic from 'next/dynamic';
const AdminProperties = dynamic(() => import('../../src/pages/admin/AdminProperties'), { ssr: false });

export default function Page() {
  return <AdminProperties />;
}
