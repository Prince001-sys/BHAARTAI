import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const token = cookieStore.get('sb-custom-jwt')?.value

  if (!token) redirect('/login')

  return (
    <div className="min-h-screen bg-[#121212] font-body-base text-white">
      {children}
    </div>
  )
}
