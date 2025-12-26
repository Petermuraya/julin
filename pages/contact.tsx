import dynamic from 'next/dynamic';
const ContactPage = dynamic(() => import('../src/pages/Contact'), { ssr: false });

export default function Page() {
  return <ContactPage />;
}
