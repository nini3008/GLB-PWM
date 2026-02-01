'use client'

import AdminGuard from '@/components/admin/AdminGuard'
import CreateSeasonForm from '@/components/admin/CreateSeasonForm'

export default function CreateSeasonPage() {
  return <AdminGuard><CreateSeasonForm /></AdminGuard>
}
