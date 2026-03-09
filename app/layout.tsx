// app/layout.tsx
import type { Metadata } from 'next';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'CCIP - Campus Communications & Interaction Platform',
  description: 'Modular campus announcements, publication, and community platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Tailwind CSS via CDN (if not using local build) */}
        <Script src="https://cdn.tailwindcss.com" strategy="beforeInteractive" />
      </head>
      <body className="bg-white text-gray-900">{children}</body>
    </html>
  );
}
