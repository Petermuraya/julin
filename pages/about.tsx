import dynamic from 'next/dynamic';
const AboutPage = dynamic(() => import('../src/pages/About'), { ssr: false });

export default function Page() {
  return <AboutPage />;
}
