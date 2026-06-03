import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-[#121212] font-body-base text-white">
      {children}
    </div>
  )
}
