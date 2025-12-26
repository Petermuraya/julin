import dynamic from 'next/dynamic';
const AdminBlogs = dynamic(() => import('../../src/pages/admin/AdminBlogs'), { ssr: false });

export default function Page() {
  return <AdminBlogs />;
}
