import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';
const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!supabaseConfigured) {
    console.warn(
        '[Supabase] Defina REACT_APP_SUPABASE_URL e REACT_APP_SUPABASE_ANON_KEY em .env.local antes do build'
    );
}

// Sem variáveis, createClient lança erro e derruba o app inteiro — só inicializa se configurado.
export const supabase = supabaseConfigured
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

export { supabaseConfigured };
