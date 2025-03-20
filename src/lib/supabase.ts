import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const supabaseUrl = 'https://bcurtjjxxnqowotzridj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjdXJ0amp4eG5xb3dvdHpyaWRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA3NzY2MzcsImV4cCI6MjA1NjM1MjYzN30.iXOX0Vubn6i5n0BdgaXq-PE5sZpWs41PQqJRLNHCFOc';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    storage: localStorage,
    storageKey: 'lab-skills-auth',
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
});