import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Evolutionary Adaptation vs Static Optimization',
  description: 'Companion experiment for "Evolving (Artificial) Intelligence" by Abhinav R. Guntaka',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="antialiased">
      <body className="font-sans min-h-screen">{children}</body>
    </html>
  );
}
