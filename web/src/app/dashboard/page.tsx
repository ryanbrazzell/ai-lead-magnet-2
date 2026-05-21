/**
 * /dashboard - password-protected A/B test results.
 * Server component: gates on the signed auth cookie, then renders either
 * the login form or the live stats from Close.
 */

import { cookies } from 'next/headers';
import { isValidAuthToken, AUTH_COOKIE_NAME } from '@/lib/dashboard/auth';
import { getAbStats } from '@/lib/close/ab-stats';
import { login } from './actions';
import { LoginForm } from '@/components/dashboard/login-form';
import { DashboardView } from '@/components/dashboard/dashboard-view';

export const metadata = { title: 'A/B Dashboard | Assistant Launch' };

// Never cache a protected page.
export const dynamic = 'force-dynamic';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const cookieStore = await cookies();
  const authed = isValidAuthToken(cookieStore.get(AUTH_COOKIE_NAME)?.value);

  if (!authed) {
    const params = await searchParams;
    return <LoginForm loginAction={login} showError={params.error === '1'} />;
  }

  const stats = await getAbStats();
  return <DashboardView stats={stats} />;
}
