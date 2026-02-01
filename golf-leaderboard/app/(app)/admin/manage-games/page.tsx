'use client'

import AdminGuard from '@/components/admin/AdminGuard'
import ManageGamesView from '@/components/admin/ManageGamesView'

export default function ManageGamesPage() {
  return <AdminGuard><ManageGamesView /></AdminGuard>
}
