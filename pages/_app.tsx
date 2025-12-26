import '../src/index.css';
import type { AppProps } from 'next/app';
import AppWrapper from '../src/App';

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AppWrapper>
      <Component {...pageProps} />
    </AppWrapper>
  );
}
