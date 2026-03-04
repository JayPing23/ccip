// app/layout.tsx
import type { Metadata } from 'next';
// import "./globals.css"; // Ensure this file exists, or remove this line if it doesn't

export const metadata: Metadata = {
  title: 'CCIP',
  description: 'Campus Content Integration Platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
