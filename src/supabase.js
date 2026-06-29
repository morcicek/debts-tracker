// src/supabase.js
import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL  = "https://tajrvpxqdfclzdwylsto.supabase.co"
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhanJ2cHhxZGZjbHpkd3lsc3RvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0NzAyNTEsImV4cCI6MjA5ODA0NjI1MX0.Dv3yypZ8teBo9IzxMY9-KXAQ4Vpd-zeZ1f5tGT65f14"

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON)
