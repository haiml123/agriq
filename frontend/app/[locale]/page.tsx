import { redirect } from 'next/navigation';

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // Redirect to dashboard as default page
  redirect(`/${locale}/dashboard`);
}
