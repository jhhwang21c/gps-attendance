import { createClient } from "@supabase/supabase-js";

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not defined");
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined");
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Initialize the Supabase client only if both URL and key are present
let supabase;

try {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            persistSession: false, // Since this will be used on both client and server
        },
    });
} catch (error) {
    console.error("Error initializing Supabase client:", error);
    throw error;
}

export { supabase };
