# Golf Leaderboard Project

## Stack
- Next.js 14 (App Router)
- Supabase (Auth + Postgres)
- Tailwind CSS + shadcn/ui
- TypeScript (strict)

## Commands
- `npm run dev` — Start dev server
- `npm run lint` — ESLint check
- `npm run build` — Production build
- `npm test` — Run Jest tests

## Key Patterns

### Types
- Shared types live in `src/types/`
- Use `ScoreWithPlayer`, `GameWithCourse`, `RoundRecap` from `@/types/scores`
- Use `filterValidScores()` for score array validation

### Scoring System (2026 season)
- Points based on absolute score brackets, NOT relative to par
- 100+: 0 pts | 95-99: 1 pt | 90-94: 2 pts | 85-89: 3 pts | 80-84: 4 pts | 75-79: 5 pts | <75: 6 pts
- Bonus point: lowest score in round gets +1

### Components
- UI components: `src/components/ui/` (shadcn)
- Feature components: `src/components/{admin,player,dashboard,leaderboard}/`
- Toast notifications: use `sonner` (`toast.success`, `toast.error`)

### Supabase
- Client: `src/lib/supabase/client.ts`
- Always handle errors from Supabase calls
- Use typed responses where possible

## Project Structure
```
src/
├── app/           # Next.js app router pages
├── components/    # React components
├── context/       # Auth context
├── hooks/         # Custom hooks
├── lib/           # Utilities, Supabase client
└── types/         # Shared TypeScript types
```

## Testing
- Run `npm run lint` after any refactor
- Check mobile responsiveness for UI changes
- Test round code flows end-to-end when touching score logic
