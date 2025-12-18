import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY

if (!supabaseKey || !supabaseUrl) {
  throw new Error('supabase credentials are required but theire not provided')
}

export const createClient = () => createBrowserClient(supabaseUrl, supabaseKey)
