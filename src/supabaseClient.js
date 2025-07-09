import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  const errorMessage = "Supabase URL or Anon Key is missing. Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your environment variables (e.g., in a .env file for local development, and in Vercel environment settings for deployment).";
  console.error(errorMessage);
  // You might want to throw an error or display this message prominently in the UI during development
  // For a production build, this check helps ensure environment variables are correctly set up.
  // Example: document.getElementById('root').innerHTML = `<div style="color: red; padding: 20px;">${errorMessage}</div>`;
  // However, throwing an error is often better to halt execution if Supabase isn't configured.
  throw new Error(errorMessage);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
