import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://nlvffxqewztfpuvzqeih.supabase.co'
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5sdmZmeHFld3p0ZnB1dnpxZWloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5NDY5NTgsImV4cCI6MjA5NjUyMjk1OH0.6tED9Mw82dh5FKaEzeagSJSWxdBg1CsZJQou4TTTE8Q'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON)
