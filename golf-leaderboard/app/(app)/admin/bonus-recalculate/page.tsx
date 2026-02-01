'use client'

import AdminGuard from '@/components/admin/AdminGuard'
import BonusPointRecalculation from '@/components/admin/BonusPointRecalculation'

export default function BonusRecalculatePage() {
  return <AdminGuard><BonusPointRecalculation /></AdminGuard>
}
