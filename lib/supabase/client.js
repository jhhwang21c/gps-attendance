import { createClient } from "@supabase/supabase-js";

let supabase;

if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
) {
    supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
            auth: {
                persistSession: false,
            },
        }
    );
}

export function getSupabase() {
    if (!supabase) {
        throw new Error(
            "Supabase client is not initialized. Check your environment variables."
        );
    }
    return supabase;
}
