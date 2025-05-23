import { createBrowserSupabaseClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "../../../packages/api-types/src/db";

export const supabase = createBrowserSupabaseClient<Database>();

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);