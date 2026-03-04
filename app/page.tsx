// app/page.tsx
import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold">Welcome to CCIP</h1>
      <p className="mt-4 text-xl">Campus Content Integration Platform</p>

      <Link href="/login" className="mt-8 rounded-lg bg-blue-600 px-6 py-3 text-white">
        Get Started
      </Link>
    </main>
  );
}
