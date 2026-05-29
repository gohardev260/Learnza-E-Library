// Learnza 2.0 - Supabase Client
import { CONFIG } from './config.js';

// Initialize Supabase client
export let supabase = null;

// Wait for Supabase to load from CDN
export function initSupabase() {
    return new Promise((resolve) => {
        const checkSupabase = () => {
            if (window.supabase) {
                supabase = window.supabase.createClient(
                    CONFIG.SUPABASE_URL,
                    CONFIG.SUPABASE_ANON_KEY
                );
                resolve(supabase);
            } else {
                setTimeout(checkSupabase, 100);
            }
        };
        checkSupabase();
    });
}

// Error handler
export function handleSupabaseError(error, context = '') {
    console.error(`Supabase error (${context}):`, error);

    if (error.message) {
        return error.message;
    }

    return `An error occurred while ${context}. Please try again.`;
}
