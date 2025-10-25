import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = 'https://ypinfmjurktclxeyjnav.supabase.co'; // ton URL
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlwaW5mbWp1cmt0Y2x4ZXlqbmF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MTUwMDMsImV4cCI6MjA3Njk5MTAwM30.dgww-Nk34pfmfx0K9qMZDmPOx8gVnhRKrAbPD3uugTQ'; // ta clé publique

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
