import dynamic from 'next/dynamic';
const AdminInquiries = dynamic(() => import('../../src/pages/admin/AdminInquiries'), { ssr: false });

export default function Page() {
  return <AdminInquiries />;
}
