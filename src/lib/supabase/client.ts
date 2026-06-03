import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export function createClient() {
  const getCookie = (name: string) => {
    if (typeof document === 'undefined') return null
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
    return match ? match[2] : null
  }

  const token = getCookie('sb-custom-jwt')
  
  const options: any = {}
  if (token) {
    options.global = {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  }

  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    options
  )
}
