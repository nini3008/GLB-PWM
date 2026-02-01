'use client'
// src/components/dashboard/DashboardView.tsx
import React from 'react';
import { Award, PlusCircle, Calendar, Flag, User, Users, ListIcon, Medal, ClipboardList, Trophy, Shield } from 'lucide-react';
import DashboardCard from './DashboardCard';
import QuickStatsBar from './QuickStatsBar';
import PendingScoresBanner from './PendingScoresBanner';
import ActivityFeed from './ActivityFeed';
import { useUser } from '@/hooks/useUser';
import { useNavigation } from '@/hooks/useNavigation';

interface DashboardViewProps {
  isAdmin: boolean;
}

export default function DashboardView({ isAdmin }: DashboardViewProps) {
  const { user } = useUser();
  const nav = useNavigation();

  return (
    <div className="space-y-8">
      {/* Main Header */}
      <div className="bg-white rounded-xl p-6 border border-gray-100">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-green-600 to-emerald-600 p-3 rounded-lg">
            <Trophy className="h-8 w-8 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-800">Dashboard</h2>
            <p className="text-gray-600 text-sm mt-1">
              {isAdmin ? 'Admin Controls & Player Tools' : 'Welcome back! Ready to play?'}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats, Pending Scores & Activity Feed */}
      {user && (
        <>
          <QuickStatsBar userId={user.id} />
          <PendingScoresBanner userId={user.id} onNavigateToEnterScore={nav.goToEnterScore} />
          <ActivityFeed userId={user.id} />
        </>
      )}

      {/* Player Tools Section */}
      <div className="bg-white rounded-xl p-6 border border-gray-100">
        <div className="flex items-center gap-2 mb-6">
          <User className="h-6 w-6 text-green-600" />
          <h3 className="text-xl font-bold text-gray-800">Player Tools</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <DashboardCard
            title="View Leaderboard"
            icon={<Award />}
            description="Check the current standings"
            onClick={nav.goToLeaderboard}
          />

          <DashboardCard
            title="Enter Score"
            icon={<PlusCircle />}
            description="Add your score from a game"
            onClick={nav.goToEnterScore}
          />

          <DashboardCard
            title="Join Season"
            icon={<Calendar />}
            description="Enter a season code"
            onClick={nav.goToJoinSeason}
          />

          <DashboardCard
            title="My Profile"
            icon={<User />}
            description="View and edit your profile"
            onClick={nav.goToProfile}
          />

          <DashboardCard
            title="View Round Scores"
            icon={<ClipboardList />}
            description="See scores for a round"
            onClick={nav.goToViewScores}
          />
        </div>
      </div>

      {/* Admin Tools Section */}
      {isAdmin && (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
          <div className="flex items-center gap-2 mb-6">
            <Shield className="h-6 w-6 text-green-700" />
            <h3 className="text-xl font-bold text-green-900">Admin Controls</h3>
            <span className="ml-auto">
              <span className="bg-green-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                Admin
              </span>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <DashboardCard
              title="Create Season"
              icon={<Calendar />}
              description="Create a new season"
              onClick={nav.goToCreateSeason}
              isAdmin={true}
            />

            <DashboardCard
              title="Manage Seasons"
              icon={<Calendar />}
              description="Activate/deactivate seasons"
              onClick={nav.goToManageSeasons}
              isAdmin={true}
            />

            <DashboardCard
              title="Create Game"
              icon={<Flag />}
              description="Set up a new game"
              onClick={nav.goToCreateGame}
              isAdmin={true}
            />

            <DashboardCard
              title="View Round Codes"
              icon={<ListIcon />}
              description="See all game codes"
              onClick={nav.goToManageGames}
              isAdmin={true}
            />

            <DashboardCard
              title="Manage Scores"
              icon={<Users />}
              description="Edit or delete scores"
              onClick={nav.goToManageScores}
              isAdmin={true}
            />

            <DashboardCard
              title="Fix Bonus Points"
              icon={<Medal />}
              description="Recalculate bonus points"
              onClick={nav.goToBonusRecalculate}
              isAdmin={true}
            />

            <DashboardCard
              title="Recalculate Handicaps"
              icon={<Users />}
              description="Update all player handicaps"
              onClick={nav.goToRecalculateHandicaps}
              isAdmin={true}
            />

            <DashboardCard
              title="Manage Courses"
              icon={<Flag />}
              description="Add and edit golf courses"
              onClick={nav.goToManageCourses}
              isAdmin={true}
            />
          </div>
        </div>
      )}
    </div>
  );
}