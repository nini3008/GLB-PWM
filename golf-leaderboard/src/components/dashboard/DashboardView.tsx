'use client'
// src/components/dashboard/DashboardView.tsx
import React from 'react';
import { Award, PlusCircle, Calendar, Flag, User, Users, ListIcon, Medal } from 'lucide-react';
import DashboardCard from './DashboardCard';

interface DashboardViewProps {
  isAdmin: boolean;
  onNavigate: (view: string) => void;
}

export default function DashboardView({ isAdmin, onNavigate }: DashboardViewProps) {
  return (
    <div className="bg-gradient-to-b from-gray-50 to-white rounded-xl shadow-lg p-8">
      <div className="flex items-center mb-8">
        <div className="h-10 w-1 bg-green-600 rounded-full mr-3"></div>
        <h2 className="text-3xl font-bold text-gray-800">Dashboard</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* All users see these options */}
        <DashboardCard 
          title="View Leaderboard" 
          icon={<Award />} 
          description="Check the current standings and scores"
          onClick={() => onNavigate('leaderboard')}
        />
        
        <DashboardCard 
          title="Enter Score" 
          icon={<PlusCircle />} 
          description="Add your score from a recent game"
          onClick={() => onNavigate('enterScore')}
        />
        
        <DashboardCard 
          title="Join Season" 
          icon={<Calendar />} 
          description="Enter a season code to participate"
          onClick={() => onNavigate('joinSeason')}
        />
        
        <DashboardCard 
          title="My Profile" 
          icon={<User />} 
          description="View and edit your profile information"
          onClick={() => onNavigate('profile')}
        />
        
        {/* Admin-only options */}
        {isAdmin && (
          <>
            <DashboardCard 
              title="Create Game" 
              icon={<Flag />} 
              description="Set up a new game for players to join"
              onClick={() => onNavigate('createGame')}
              isAdmin={true}
            />
            
            <DashboardCard 
              title="Manage Scores" 
              icon={<Users />} 
              description="Edit or delete player scores"
              onClick={() => onNavigate('manageScores')}
              isAdmin={true}
            />
            
            <DashboardCard 
              title="View Round Codes" 
              icon={<ListIcon />} 
              description="See all game round codes"
              onClick={() => onNavigate('viewCodes')}
              isAdmin={true}
            />
            
            <DashboardCard 
              title="Fix Bonus Points" 
              icon={<Medal />} 
              description="Recalculate bonus points for rounds"
              onClick={() => onNavigate('bonusRecalculate')}
              isAdmin={true}
            />
          </>
        )}
      </div>
    </div>
  );
}