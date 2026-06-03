import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardNav from '@/components/dashboard/DashboardNav'

export const metadata: Metadata = {
  title: 'Dashboard — StudyFlow AI',
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-[#121212] font-body-base text-white">
      <DashboardNav />
      <div className="md:pl-64 min-h-screen flex flex-col">
        {children}
      </div>
    </div>
  )
}
