import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
        '[Supabase] Defina REACT_APP_SUPABASE_URL e REACT_APP_SUPABASE_ANON_KEY em .env.local'
    );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
