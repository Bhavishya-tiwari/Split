'use server';

import { redirect } from 'next/navigation';
import { createClientForServer } from './supabase/server';

export async function signInWithGoogle() {
  const supabase = await createClientForServer();
  const auth_callback_url = `${process.env.NEXT_PUBLIC_AUTH_CALLBACK_URL}/auth/callback`;

  console.log('🔗 Auth callback URL:', auth_callback_url);
  console.log('🌍 Base URL from env:', process.env.NEXT_PUBLIC_AUTH_CALLBACK_URL);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: auth_callback_url,
    },
  });
  console.log(data);
  if (error) {
    console.error(error);
  }
  redirect(data.url);
}
