import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://YOUR_SUPABASE_PROJECT.supabase.co";
const SUPABASE_KEY = "YOUR_SUPABASE_ANON_KEY";

// IMPORTANT:
// Replace the two constants above with your existing values (same as in supabaseService.ts).
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export async function requestAccessCodeByEmail(email: string): Promise<{ ok: boolean; error?: string }> {
  const normalizedEmail = (email || '').trim().toLowerCase();

  // Always return a neutral response on the client side; do not leak if email exists.
  if (!normalizedEmail) return { ok: true };

  const { data, error } = await supabase.functions.invoke('request-access-code', {
    body: { email: normalizedEmail },
  });

  if (error) {
    // Still keep response neutral to user; but return error for optional UI display/logging.
    return { ok: false, error: error.message || 'Edge function error' };
  }

  if (data?.ok === false) {
    return { ok: false, error: data?.error || 'Unknown error' };
  }

  return { ok: true };
}
