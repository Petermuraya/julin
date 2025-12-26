import dynamic from 'next/dynamic';
const IndexPage = dynamic(() => import('../src/pages/Index'), { ssr: false });

export default function Page() {
  return <IndexPage />;
}
