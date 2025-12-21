import { redirect } from '@/i18n/routing';

export default function Home() {
  // Redirect to dashboard as default page
  redirect('/dashboard');
}
