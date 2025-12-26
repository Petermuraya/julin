import dynamic from 'next/dynamic';
const AdminProfile = dynamic(() => import('../../src/pages/admin/AdminProfile'), { ssr: false });

export default function Page() {
  return <AdminProfile />;
}
