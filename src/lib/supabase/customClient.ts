import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export function createCustomClient(jwt?: string) {
  const options: any = {}
  if (jwt) {
    options.global = {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    }
  }

  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    options
  )
}
