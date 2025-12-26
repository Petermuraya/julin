import dynamic from 'next/dynamic';
const DebugPage = dynamic(() => import('../src/pages/Debug'), { ssr: false });

export default function Page() {
  return <DebugPage />;
}
