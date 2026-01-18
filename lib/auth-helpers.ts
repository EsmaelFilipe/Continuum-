import { createClient } from '@supabase/supabase-js';
import { cookies, headers } from 'next/headers';

// Helper to get authenticated user from request
export async function getUserFromRequest() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (!supabaseUrl || !supabaseAnonKey) {
    return { user: null, error: 'Supabase not configured' };
  }

  // Try to get token from Authorization header first
  const headersList = await headers();
  const authHeader = headersList.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  // Create a Supabase client
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  let user = null;
  let error = null;

  if (token) {
    // If we have a token from header, use it
    const { data, error: tokenError } = await supabase.auth.getUser(token);
    user = data.user;
    error = tokenError;
  } else {
    // Otherwise, try to get from cookies
    const cookieStore = await cookies();
    const supabaseWithCookies = createClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    });

    const { data, error: cookieError } = await supabaseWithCookies.auth.getUser();
    user = data.user;
    error = cookieError;
  }

  return { user, error };
}

