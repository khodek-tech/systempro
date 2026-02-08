import { HomePage } from '@/components/home-page';

interface PageProps {
  params: Promise<{ slug?: string[] }>;
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  return <HomePage slug={slug || []} />;
}
