import { redirect } from 'next/navigation';

interface FeedContentRedirectPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function FeedContentRedirectPage({ params }: FeedContentRedirectPageProps) {
  const { slug } = await params;

  redirect(`/content/${encodeURIComponent(slug)}`);
}
