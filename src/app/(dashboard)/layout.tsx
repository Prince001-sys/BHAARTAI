import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import DashboardNav from '@/components/dashboard/DashboardNav'
import { cookies } from 'next/headers'

export const metadata: Metadata = {
  title: 'Dashboard — StudyFlow AI',
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const token = cookieStore.get('sb-custom-jwt')?.value

  if (!token) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-[#121212] font-body-base text-white">
      <DashboardNav />
      <div className="md:pl-64 min-h-screen flex flex-col">
        {children}
      </div>
    </div>
  )
}

