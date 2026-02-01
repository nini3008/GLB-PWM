'use client'

import { useEffect, useState } from 'react'
import { getSeasonSummary, SeasonSummaryData } from '@/lib/supabase/seasonSummary'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Trophy, TrendingUp, Target, Award, Loader2, Users, Flag } from 'lucide-react'

interface SeasonSummaryProps {
  seasonId: string
  seasonName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function SeasonSummary({ seasonId, seasonName, open, onOpenChange }: SeasonSummaryProps) {
  const [data, setData] = useState<SeasonSummaryData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !seasonId) return

    setLoading(true)
    setError(null)
    getSeasonSummary(seasonId)
      .then(setData)
      .catch((err) => {
        console.error('Failed to load season summary:', err)
        setError('Failed to load season summary')
      })
      .finally(() => setLoading(false))
  }, [open, seasonId])

  const awards = data
    ? [
        { icon: Trophy, label: 'MVP (Most Points)', player: data.mvp, color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
        { icon: TrendingUp, label: 'Most Improved', player: data.mostImproved, color: 'text-blue-600 bg-blue-50 border-blue-200' },
        { icon: Target, label: 'Most Consistent', player: data.mostConsistent, color: 'text-purple-600 bg-purple-50 border-purple-200' },
        { icon: Award, label: 'Best Single Round', player: data.bestRound, color: 'text-green-600 bg-green-50 border-green-200' },
      ]
    : []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Trophy className="h-6 w-6 text-yellow-500" />
            Season Summary — {seasonName}
          </DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-green-600" />
          </div>
        )}

        {error && <p className="text-red-600 text-center py-4">{error}</p>}

        {data && !loading && (
          <div className="space-y-4">
            <div className="flex gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1"><Users className="h-4 w-4" /> {data.totalPlayers} players</span>
              <span className="flex items-center gap-1"><Flag className="h-4 w-4" /> {data.totalRounds} rounds</span>
            </div>

            <div className="space-y-3">
              {awards.map(({ icon: Icon, label, player, color }) => (
                <div key={label} className={`flex items-center gap-3 p-3 rounded-lg border ${color}`}>
                  <Icon className="h-6 w-6 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-medium opacity-75">{label}</p>
                    {player ? (
                      <p className="font-semibold">
                        {player.username} <span className="font-normal text-sm">— {player.value}</span>
                      </p>
                    ) : (
                      <p className="text-sm italic opacity-60">Not enough data</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
