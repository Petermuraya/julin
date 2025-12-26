import dynamic from 'next/dynamic';
const BlogsPage = dynamic(() => import('../src/pages/BlogsPage'), { ssr: false });

export default function Page() {
  return <BlogsPage />;
}
