// Mock data for leaderboard tests
export const mockSeasons = [
  {
    id: 'season-1',
    name: 'Spring 2024',
    code: 'SPRING2024',
    start_date: '2024-03-01',
    end_date: '2024-05-31',
    is_active: true,
  },
  {
    id: 'season-2',
    name: 'Summer 2024',
    code: 'SUMMER2024',
    start_date: '2024-06-01',
    end_date: '2024-08-31',
    is_active: false,
  },
]

export const mockLeaderboardData = [
  {
    player_id: 'player-1',
    username: 'john_doe',
    profile_image_url: 'https://example.com/john.jpg',
    games_played: 10,
    total_points: 95,
    avg_score: 72.5,
  },
  {
    player_id: 'player-2',
    username: 'jane_smith',
    profile_image_url: null,
    games_played: 8,
    total_points: 88,
    avg_score: 74.2,
  },
  {
    player_id: 'player-3',
    username: 'bob_wilson',
    profile_image_url: 'https://example.com/bob.jpg',
    games_played: 12,
    total_points: 82,
    avg_score: 75.8,
  },
  {
    player_id: 'player-4',
    username: 'alice_johnson',
    profile_image_url: null,
    games_played: 6,
    total_points: 78,
    avg_score: 73.1,
  },
  {
    player_id: 'player-5',
    username: 'charlie_brown',
    profile_image_url: 'https://example.com/charlie.jpg',
    games_played: 9,
    total_points: 75,
    avg_score: 76.3,
  },
]

export const mockLeaderboardDataWithTies = [
  {
    player_id: 'player-1',
    username: 'john_doe',
    profile_image_url: 'https://example.com/john.jpg',
    games_played: 10,
    total_points: 95,
    avg_score: 72.5,
  },
  {
    player_id: 'player-2',
    username: 'jane_smith',
    profile_image_url: null,
    games_played: 8,
    total_points: 95,
    avg_score: 74.2,
  },
  {
    player_id: 'player-3',
    username: 'bob_wilson',
    profile_image_url: 'https://example.com/bob.jpg',
    games_played: 12,
    total_points: 82,
    avg_score: 75.8,
  },
]

export const mockPlayerCardData = {
  profile: {
    username: 'john_doe',
    first_name: 'John',
    last_name: 'Doe',
    bio: 'Passionate golfer and weekend warrior',
    handicap: 10.5,
    profile_image_url: 'https://example.com/john.jpg',
  },
  stats: {
    gamesPlayed: 15,
    averageScore: 82.3,
    bestScore: 72,
    totalPoints: 145,
  },
  recentScores: [
    {
      id: 'score-1',
      raw_score: 78,
      points: 8,
      bonus_points: 1,
      submitted_at: '2024-03-15T10:00:00Z',
      game: {
        name: 'Saturday Morning Round',
        game_date: '2024-03-15',
        course: {
          name: 'Pebble Beach',
          par: 72,
        },
      },
    },
    {
      id: 'score-2',
      raw_score: 85,
      points: 5,
      bonus_points: 0,
      submitted_at: '2024-03-08T14:30:00Z',
      game: {
        name: 'Weekend Tournament',
        game_date: '2024-03-08',
        course: {
          name: 'Augusta National',
          par: 72,
        },
      },
    },
    {
      id: 'score-3',
      raw_score: 72,
      points: 10,
      bonus_points: 1,
      submitted_at: '2024-03-01T09:00:00Z',
      game: {
        name: 'Practice Round',
        game_date: '2024-03-01',
        course: {
          name: 'St Andrews',
          par: 72,
        },
      },
    },
  ],
  achievements: [
    {
      id: 'ach-1',
      earned_at: '2024-03-01T09:00:00Z',
      season_id: 'season-1',
      achievements: {
        id: 'achievement-1',
        key: 'first_par',
        name: 'Par Excellence',
        description: 'Score your first par',
        icon: 'trophy',
        category: 'scoring',
        tier: 'bronze',
      },
      seasons: {
        name: 'Spring 2024',
      },
    },
    {
      id: 'ach-2',
      earned_at: '2024-03-15T10:00:00Z',
      season_id: 'season-1',
      achievements: {
        id: 'achievement-2',
        key: 'ten_games',
        name: 'Dedicated Player',
        description: 'Play 10 games in a season',
        icon: 'star',
        category: 'participation',
        tier: 'silver',
      },
      seasons: {
        name: 'Spring 2024',
      },
    },
  ],
}

// Mock Supabase client
export const createMockSupabaseClient = () => {
  const mockSelect = jest.fn().mockReturnThis()
  const mockEq = jest.fn().mockReturnThis()
  const mockOrder = jest.fn().mockReturnThis()
  const mockSingle = jest.fn()
  const mockFrom = jest.fn().mockReturnThis()

  return {
    from: mockFrom,
    select: mockSelect,
    eq: mockEq,
    order: mockOrder,
    single: mockSingle,
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
    },
  }
}

// Helper to create mock getSeasonLeaderboard function
export const createMockGetSeasonLeaderboard = (data = mockLeaderboardData) => {
  return jest.fn().mockResolvedValue(data)
}

// Helper to create mock getPlayerCardData function
export const createMockGetPlayerCardData = (data = mockPlayerCardData) => {
  return jest.fn().mockResolvedValue(data)
}

// Helper to create mock isUserAdmin function
export const createMockIsUserAdmin = (isAdmin = false) => {
  return jest.fn().mockResolvedValue(isAdmin)
}
