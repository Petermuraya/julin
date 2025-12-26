import dynamic from 'next/dynamic';
const PropertiesPage = dynamic(() => import('../src/pages/PropertiesPage'), { ssr: false });

export default function Page() {
  return <PropertiesPage />;
}
