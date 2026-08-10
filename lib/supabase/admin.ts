import { createClient } from "@supabase/supabase-js";

function readRequiredEnvironmentVariable(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getSupabaseAdmin() {
  return createClient(
    readRequiredEnvironmentVariable("NEXT_PUBLIC_SUPABASE_URL"),
    readRequiredEnvironmentVariable("SUPABASE_SECRET_KEY"),
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
