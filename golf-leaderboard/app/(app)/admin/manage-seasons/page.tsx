'use client'

import AdminGuard from '@/components/admin/AdminGuard'
import ManageSeasonsView from '@/components/admin/ManageSeasonsView'

export default function ManageSeasonsPage() {
  return <AdminGuard><ManageSeasonsView /></AdminGuard>
}
