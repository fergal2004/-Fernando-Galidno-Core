import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gfsmptallhitytrllmdx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdmc21wdGFsbGhpdHl0cmxsbWR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1MjI5NDYsImV4cCI6MjA5MTA5ODk0Nn0.M_cgLC8kkXoalvGnraGz0n3nK8ij0hkLcetJeh2hJlQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);