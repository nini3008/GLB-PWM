'use client'

import { useRouter } from 'next/navigation'
import { useCallback } from 'react'

export function useNavigation() {
  const router = useRouter()

  return {
    goToDashboard: useCallback(() => router.push('/dashboard'), [router]),
    goToLeaderboard: useCallback(() => router.push('/leaderboard'), [router]),
    goToEnterScore: useCallback(() => router.push('/scores/enter'), [router]),
    goToViewScores: useCallback(() => router.push('/scores/view'), [router]),
    goToJoinSeason: useCallback(() => router.push('/join-season'), [router]),
    goToProfile: useCallback(() => router.push('/profile'), [router]),
    goToLogin: useCallback(() => router.push('/login'), [router]),
    goToRegister: useCallback(() => router.push('/register'), [router]),
    goToForgotPassword: useCallback(() => router.push('/forgot-password'), [router]),
    goToResetPassword: useCallback(() => router.push('/reset-password'), [router]),
    goToCreateSeason: useCallback(() => router.push('/admin/create-season'), [router]),
    goToManageSeasons: useCallback(() => router.push('/admin/manage-seasons'), [router]),
    goToCreateGame: useCallback(() => router.push('/admin/create-game'), [router]),
    goToManageScores: useCallback(() => router.push('/admin/manage-scores'), [router]),
    goToManageCourses: useCallback(() => router.push('/admin/manage-courses'), [router]),
    goToManageGames: useCallback(() => router.push('/admin/manage-games'), [router]),
    goToBonusRecalculate: useCallback(() => router.push('/admin/bonus-recalculate'), [router]),
    goToRecalculateHandicaps: useCallback(() => router.push('/admin/recalculate-handicaps'), [router]),
    router,
  }
}
