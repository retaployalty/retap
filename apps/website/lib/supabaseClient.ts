import { createBrowserSupabaseClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "../../../packages/api-types/src/db";

export const supabase = createBrowserSupabaseClient<Database>(); 