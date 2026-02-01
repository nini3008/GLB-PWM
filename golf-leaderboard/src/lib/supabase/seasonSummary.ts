import { supabase } from './client'

interface PlayerAward {
  playerId: string
  username: string
  value: number | string
}

export interface SeasonSummaryData {
  mvp: PlayerAward | null
  mostImproved: PlayerAward | null
  mostConsistent: PlayerAward | null
  bestRound: PlayerAward | null
  totalRounds: number
  totalPlayers: number
}

export async function getSeasonSummary(seasonId: string): Promise<SeasonSummaryData> {
  // Get all scores for this season with player info
  // First get game IDs for this season
  const { data: games, error: gamesError } = await supabase
    .from('games')
    .select('id, courses:course_id ( par )')
    .eq('season_id', seasonId)

  if (gamesError) throw gamesError
  if (!games || games.length === 0) {
    return { mvp: null, mostImproved: null, mostConsistent: null, bestRound: null, totalRounds: 0, totalPlayers: 0 }
  }

  const gameIds = games.map(g => g.id)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gamePar: Record<string, number> = Object.fromEntries(games.map(g => [g.id, (g.courses as any)?.par || 72]))

  const { data: scores, error } = await supabase
    .from('scores')
    .select(`
      id,
      player_id,
      game_id,
      raw_score,
      points,
      bonus_points,
      submitted_at,
      profiles!player_id ( username )
    `)
    .in('game_id', gameIds)
    .order('submitted_at', { ascending: true })

  if (error) throw error
  if (!scores || scores.length === 0) {
    return { mvp: null, mostImproved: null, mostConsistent: null, bestRound: null, totalRounds: 0, totalPlayers: 0 }
  }

  // Group scores by player
  const playerScores: Record<string, { username: string; scores: number[]; points: number; rawScores: { score: number; par: number }[] }> = {}

  for (const score of scores) {
    const pid = score.player_id
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const username = (score.profiles as any)?.username || 'Unknown'
    const par = gamePar[score.game_id] || 72

    if (!playerScores[pid]) {
      playerScores[pid] = { username, scores: [], points: 0, rawScores: [] }
    }
    playerScores[pid].scores.push(score.raw_score)
    playerScores[pid].points += (score.points || 0) + (score.bonus_points || 0)
    playerScores[pid].rawScores.push({ score: score.raw_score, par })
  }

  const playerIds = Object.keys(playerScores)

  // MVP: most total points
  let mvp: PlayerAward | null = null
  let maxPoints = -1
  for (const pid of playerIds) {
    if (playerScores[pid].points > maxPoints) {
      maxPoints = playerScores[pid].points
      mvp = { playerId: pid, username: playerScores[pid].username, value: maxPoints }
    }
  }

  // Most Improved: biggest average score drop (first half vs second half)
  let mostImproved: PlayerAward | null = null
  let biggestDrop = -Infinity
  for (const pid of playerIds) {
    const s = playerScores[pid].scores
    if (s.length < 4) continue // need at least 4 rounds to compare halves
    const mid = Math.floor(s.length / 2)
    const firstHalfAvg = s.slice(0, mid).reduce((a, b) => a + b, 0) / mid
    const secondHalfAvg = s.slice(mid).reduce((a, b) => a + b, 0) / (s.length - mid)
    const drop = firstHalfAvg - secondHalfAvg
    if (drop > biggestDrop) {
      biggestDrop = drop
      mostImproved = { playerId: pid, username: playerScores[pid].username, value: `${drop.toFixed(1)} strokes` }
    }
  }

  // Most Consistent: lowest standard deviation (min 3 rounds)
  let mostConsistent: PlayerAward | null = null
  let lowestStdDev = Infinity
  for (const pid of playerIds) {
    const s = playerScores[pid].scores
    if (s.length < 3) continue
    const mean = s.reduce((a, b) => a + b, 0) / s.length
    const variance = s.reduce((sum, val) => sum + (val - mean) ** 2, 0) / s.length
    const stdDev = Math.sqrt(variance)
    if (stdDev < lowestStdDev) {
      lowestStdDev = stdDev
      mostConsistent = { playerId: pid, username: playerScores[pid].username, value: `${stdDev.toFixed(1)} std dev` }
    }
  }

  // Best Single Round: lowest score relative to par
  let bestRound: PlayerAward | null = null
  let bestRelative = Infinity
  for (const pid of playerIds) {
    for (const round of playerScores[pid].rawScores) {
      const relative = round.score - round.par
      if (relative < bestRelative) {
        bestRelative = relative
        const label = bestRelative === 0 ? 'E' : bestRelative > 0 ? `+${bestRelative}` : `${bestRelative}`
        bestRound = { playerId: pid, username: playerScores[pid].username, value: `${round.score} (${label})` }
      }
    }
  }

  return {
    mvp,
    mostImproved,
    mostConsistent,
    bestRound,
    totalRounds: gameIds.length,
    totalPlayers: playerIds.length,
  }
}
