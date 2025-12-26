import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
const BlogDetail = dynamic(() => import('../../src/pages/BlogDetailPage'), { ssr: false });

export default function Page() {
  const router = useRouter();
  return <BlogDetail key={router.asPath} />;
}
