'use client'
// src/components/dashboard/DashboardView.tsx
import React, { useMemo } from 'react';
import { Award, PlusCircle, Calendar, Flag, User, Users, ListIcon, Medal, ClipboardList, Shield } from 'lucide-react';
import DashboardCard from './DashboardCard';
import QuickStatsBar from './QuickStatsBar';
import PendingScoresBanner from './PendingScoresBanner';
import ActivityFeed from './ActivityFeed';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUser } from '@/hooks/useUser';
import { useNavigation } from '@/hooks/useNavigation';

// Golf-themed subtexts for the dashboard greeting
const golfSubtexts = [
  "Time to see who's buying drinks at the 19th hole.",
  "Let's see if that handicap is still accurate.",
  "Mulligans don't count here.",
  "No foot wedges in these scores.",
  "The leaderboard awaits your glory... or shame.",
  "How many balls did you sacrifice today?",
  "Your scorecard can't hide forever.",
  "Someone's gotta be at the bottom of the leaderboard.",
  "Did you break 100? Be honest.",
  "The trees giveth, and the trees taketh away.",
  "Remember: it's not about the score, it's about... wait, yes it is.",
  "Your handicap called. It's worried.",
  "Another day, another lost ball.",
  "Let's pretend that triple bogey didn't happen.",
  "Golf: where you pay to be frustrated.",
  "At least you're not working.",
  "Fairways are overrated anyway.",
  "The rough builds character.",
  "That putt was closer than it looked. Right?",
  "Grip it and rip it. Then go find it.",
];

interface DashboardViewProps {
  isAdmin: boolean;
}

export default function DashboardView({ isAdmin }: DashboardViewProps) {
  const { user, profile } = useUser();
  const nav = useNavigation();

  // Pick a random subtext on mount (stable for session)
  const subtext = useMemo(() => {
    return golfSubtexts[Math.floor(Math.random() * golfSubtexts.length)];
  }, []);

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-6">
      {/* Compact Greeting Row */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            {getGreeting()}, {profile?.username || 'Player'}
          </h2>
          <p className="text-gray-500 text-sm">{subtext}</p>
        </div>
      </div>

      {/* Primary Actions - Large, prominent buttons */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={nav.goToEnterScore}
          className="flex items-center justify-center gap-3 bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl p-5 shadow-md hover:shadow-lg transition-all duration-200"
        >
          <PlusCircle className="h-6 w-6" />
          <span className="font-semibold text-lg">Enter Score</span>
        </button>
        <button
          onClick={nav.goToLeaderboard}
          className="flex items-center justify-center gap-3 bg-gradient-to-br from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl p-5 shadow-md hover:shadow-lg transition-all duration-200"
        >
          <Award className="h-6 w-6" />
          <span className="font-semibold text-lg">Leaderboard</span>
        </button>
      </div>

      {/* Pending Scores */}
      {user && <PendingScoresBanner userId={user.id} onNavigateToEnterScore={nav.goToEnterScore} />}

      {/* 2-Column Layout: Stats + Activity */}
      {user && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <QuickStatsBar userId={user.id} />
          </div>
          <div className="lg:col-span-1">
            <ActivityFeed userId={user.id} />
          </div>
        </div>
      )}

      {/* Tools Section - With tabs for admin */}
      {isAdmin ? (
        <Tabs defaultValue="player" className="w-full">
          <TabsList className="w-full justify-start bg-gray-100 p-1 rounded-lg">
            <TabsTrigger value="player" className="flex-1 max-w-40">
              <User className="h-4 w-4 mr-1.5" />
              Player Tools
            </TabsTrigger>
            <TabsTrigger value="admin" className="flex-1 max-w-40">
              <Shield className="h-4 w-4 mr-1.5" />
              Admin Tools
            </TabsTrigger>
          </TabsList>

          <TabsContent value="player" className="mt-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              <DashboardCard
                title="Join Season"
                icon={<Calendar className="h-5 w-5" />}
                onClick={nav.goToJoinSeason}
              />
              <DashboardCard
                title="My Profile"
                icon={<User className="h-5 w-5" />}
                onClick={nav.goToProfile}
              />
              <DashboardCard
                title="View Scores"
                icon={<ClipboardList className="h-5 w-5" />}
                onClick={nav.goToViewScores}
              />
            </div>
          </TabsContent>

          <TabsContent value="admin" className="mt-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              <DashboardCard
                title="Create Season"
                icon={<Calendar className="h-5 w-5" />}
                onClick={nav.goToCreateSeason}
                isAdmin
              />
              <DashboardCard
                title="Manage Seasons"
                icon={<Calendar className="h-5 w-5" />}
                onClick={nav.goToManageSeasons}
                isAdmin
              />
              <DashboardCard
                title="Create Game"
                icon={<Flag className="h-5 w-5" />}
                onClick={nav.goToCreateGame}
                isAdmin
              />
              <DashboardCard
                title="Round Codes"
                icon={<ListIcon className="h-5 w-5" />}
                onClick={nav.goToManageGames}
                isAdmin
              />
              <DashboardCard
                title="Manage Scores"
                icon={<Users className="h-5 w-5" />}
                onClick={nav.goToManageScores}
                isAdmin
              />
              <DashboardCard
                title="Fix Bonus"
                icon={<Medal className="h-5 w-5" />}
                onClick={nav.goToBonusRecalculate}
                isAdmin
              />
              <DashboardCard
                title="Recalc Handicaps"
                icon={<Users className="h-5 w-5" />}
                onClick={nav.goToRecalculateHandicaps}
                isAdmin
              />
              <DashboardCard
                title="Manage Courses"
                icon={<Flag className="h-5 w-5" />}
                onClick={nav.goToManageCourses}
                isAdmin
              />
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        /* Non-admin: Just show player tools directly */
        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <User className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-800">Quick Actions</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <DashboardCard
              title="Join Season"
              icon={<Calendar className="h-5 w-5" />}
              onClick={nav.goToJoinSeason}
            />
            <DashboardCard
              title="My Profile"
              icon={<User className="h-5 w-5" />}
              onClick={nav.goToProfile}
            />
            <DashboardCard
              title="View Scores"
              icon={<ClipboardList className="h-5 w-5" />}
              onClick={nav.goToViewScores}
            />
          </div>
        </div>
      )}
    </div>
  );
}
