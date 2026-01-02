import './globals.css';
import { Providers } from './providers';

export const metadata = {
  title: 'Julin Real Estate Hub',
  description: 'Julin Real Estate — migrated to Next.js App Router',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
