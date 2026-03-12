import { createClient } from '@supabase/supabase-js';
const SUPABASE_URL = "https://gkwwlxcisqrazgfhcknx.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdrd3dseGNpc3FyYXpnZmhja254Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMTIzNzcsImV4cCI6MjA4ODc4ODM3N30.OmaZnNOxrre-ZQN2mRZjkHgFmIplX9EhXeDG4FRw8yc";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
async function run() {
  const { data } = await supabase.from('shifts').select('*');
  console.log(data);
}
run();
