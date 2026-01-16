import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Helper to get authenticated user from request
export async function getUserFromRequest() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (!supabaseUrl || !supabaseAnonKey) {
    return { user: null, error: 'Supabase not configured' };
  }

  // Create a Supabase client with the request
  const cookieStore = await cookies();
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
    },
  });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  return { user, error };
}

