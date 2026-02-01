'use client'

import AdminGuard from '@/components/admin/AdminGuard'
import ManageScoresView from '@/components/admin/ManageScoresView'

export default function ManageScoresPage() {
  return <AdminGuard><ManageScoresView /></AdminGuard>
}
