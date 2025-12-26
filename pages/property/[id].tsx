import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
const PropertyDetail = dynamic(() => import('../../src/pages/PropertyDetailPage'), { ssr: false });

export default function Page() {
  // let the client page read the id from router or its own hooks
  const router = useRouter();
  return <PropertyDetail key={router.asPath} />;
}
