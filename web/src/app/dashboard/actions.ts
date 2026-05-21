'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { checkPassword, mintAuthToken, AUTH_COOKIE_NAME } from '@/lib/dashboard/auth';

const COOKIE_MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 days

/**
 * Login server action. On the correct password it sets the signed auth
 * cookie and reloads /dashboard; otherwise it redirects back with ?error=1.
 */
export async function login(formData: FormData): Promise<void> {
  const submitted = String(formData.get('password') ?? '');

  if (!checkPassword(submitted)) {
    redirect('/dashboard?error=1');
  }

  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, mintAuthToken(), {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/dashboard',
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });

  redirect('/dashboard');
}
