// app/layout.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CCIP - Centralized Campus Information Portal',
  description: 'Official university announcements and communications in one place',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Tailwind CSS via CDN (if not using local build) */}
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body className="bg-white text-gray-900">{children}</body>
    </html>
  );
}
