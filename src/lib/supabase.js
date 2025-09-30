// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'

// Configuración de Supabase
const supabaseUrl = 'https://xrflzmovtmlfrjhtoejs.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyZmx6bW92dG1sZnJqaHRvZWpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxMzQyNzksImV4cCI6MjA3MTcxMDI3OX0.6d8cN4rY3f98NdNNJ_IA7WxQ2wk2XCSt-vuQ63Ke9d4'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})