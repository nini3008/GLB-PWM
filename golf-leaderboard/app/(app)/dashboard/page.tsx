'use client'

import { useAuth } from '@/context/AuthContext'
import DashboardView from '@/components/dashboard/DashboardView'

export default function DashboardPage() {
  const { isAdmin } = useAuth()
  return <DashboardView isAdmin={isAdmin} />
}
