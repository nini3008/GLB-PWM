'use client'

import AdminGuard from '@/components/admin/AdminGuard'
import ManageCoursesView from '@/components/admin/ManageCoursesView'

export default function ManageCoursesPage() {
  return <AdminGuard><ManageCoursesView /></AdminGuard>
}
