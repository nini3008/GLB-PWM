'use client'

import AdminGuard from '@/components/admin/AdminGuard'
import RecalculateHandicaps from '@/components/admin/RecalculateHandicaps'

export default function RecalculateHandicapsPage() {
  return <AdminGuard><RecalculateHandicaps /></AdminGuard>
}
