'use client'

import AdminGuard from '@/components/admin/AdminGuard'
import CreateGameForm from '@/components/admin/CreateGameForm'

export default function CreateGamePage() {
  return <AdminGuard><CreateGameForm /></AdminGuard>
}
