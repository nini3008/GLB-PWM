// src/components/GolfLeaderboardApp.tsx
'use client'

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { GoalIcon } from 'lucide-react';

// Dynamic imports for better performance and code splitting
const LoginForm = React.lazy(() => import('./auth/LoginForm'));
const RegisterForm = React.lazy(() => import('./auth/RegistrationForm'));
const EnterScoreForm = React.lazy(() => import('./player/EnterScoreForm'));
const LeaderboardTable = React.lazy(() => import('./leaderboard/LeaderboardTable').then(module => ({ default: module.LeaderboardTable })));
const MainLayout = React.lazy(() => import('./layout/MainLayout'));
const DashboardView = React.lazy(() => import('./dashboard/DashboardView'));
const JoinSeasonForm = React.lazy(() => import('./player/JoinSeasonForm'));
const ProfileForm = React.lazy(() => import('./player/ProfileForm'));
const CreateGameForm = React.lazy(() => import('./admin/CreateGameForm'));
const ManageScoresView = React.lazy(() => import('./admin/ManageScoresView'));
const ManageGamesView = React.lazy(() => import('./admin/ManageGamesView'));
const ResetPasswordPage = React.lazy(() => import('./auth/ResetPasswordPage'));
const ForgotPasswordForm = React.lazy(() => import('./auth/ForgotPassword'));
const BonusPointRecalculation = React.lazy(() => import('./admin/BonusPointRecalculation'))


// Loading component with shimmer effect
const LoadingView = ({ message = "Loading..." }) => (
  <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex flex-col items-center justify-center p-4">
    <Card className="w-full max-w-md overflow-hidden">
      <div className="bg-gradient-to-r from-green-600 to-green-700 h-2" />
      <CardContent className="p-6">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
            <GoalIcon className="h-8 w-8 text-green-600" />
            <div className="absolute -inset-1 rounded-full border-2 border-t-green-500 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
          </div>
          <h2 className="text-xl font-semibold text-center text-green-800">{message}</h2>
          <div className="w-full space-y-3">
            <Skeleton className="h-4 w-full bg-green-100" />
            <Skeleton className="h-4 w-3/4 bg-green-100" />
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

// Component Loader with error boundary
const ComponentLoader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Suspense fallback={<LoadingView message="Loading component..." />}>
    {children}
  </Suspense>
);

// Main App Component
export function GolfLeaderboardApp() {
  const { user, isAdmin, isLoading } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [isTransitioning, setIsTransitioning] = useState(false);
  // Ref to track auth state changes vs manual navigation
  const authChangeRef = useRef(false);

  // Check for reset password token in URL
  useEffect(() => {
    // If the URL contains a password reset token, show the reset password view
    const url = new URL(window.location.href);
    const type = url.searchParams.get('type');
    if (type === 'recovery') {
      setCurrentView('resetPassword');
      // Clean up the URL to remove the query parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Reset to dashboard on login/logout - fixed to avoid circular dependency
  useEffect(() => {
    // Mark that this change is from auth, not manual navigation
    authChangeRef.current = true;
    
    if (user) {
      setCurrentView('dashboard');
    } else {
      // Only set to login if not in special auth flows
      const authViews = ['forgotPassword', 'resetPassword', 'register'];
      if (!authViews.includes(currentView)) {
        setCurrentView('login');
      }
    }
    
    // Reset the flag after a short delay
    const timer = setTimeout(() => {
      authChangeRef.current = false;
    }, 200);
    
    return () => clearTimeout(timer);
  }, [user]);

  // Navigation with transition
  const navigateTo = (view: React.SetStateAction<string>) => {
    // Skip if this is an auth-triggered navigation to avoid conflicts
    if (authChangeRef.current) {
      console.log('Skipping manual navigation during auth change');
      return;
    }
    
    setIsTransitioning(true);
    
    // Short delay to show transition
    setTimeout(() => {
      setCurrentView(view);
      setIsTransitioning(false);
    }, 150);
  };

  // Loading state
  if (isLoading) {
    return <LoadingView message="Setting up your golf experience..." />;
  }

  // Render the appropriate view based on the current state
  const renderView = () => {
    if (isTransitioning) {
      return <LoadingView message="Changing views..." />;
    }

    switch (currentView) {
      case 'login':
        return (
          <ComponentLoader>
            <LoginForm 
              onRegisterClick={() => navigateTo('register')} 
              onForgotPasswordClick={() => navigateTo('forgotPassword')}
            />
          </ComponentLoader>
        );
      case 'register':
        return (
          <ComponentLoader>
            <RegisterForm onLoginClick={() => navigateTo('login')} />
          </ComponentLoader>
        );
      case 'forgotPassword':
        return (
          <ComponentLoader>
            <ForgotPasswordForm onBackToLogin={() => navigateTo('login')} />
          </ComponentLoader>
        );
      case 'resetPassword':
        return (
          <ComponentLoader>
            <ResetPasswordPage onComplete={() => navigateTo('login')} />
          </ComponentLoader>
        );
      case 'dashboard':
        return (
          <ComponentLoader>
            <DashboardView 
              isAdmin={isAdmin} 
              onNavigate={navigateTo}
            />
          </ComponentLoader>
        );
      case 'leaderboard':
        return (
          <ComponentLoader>
            <LeaderboardTable onReturn={() => navigateTo('dashboard')} />
          </ComponentLoader>
        );
      case 'enterScore':
        return (
          <ComponentLoader>
            <EnterScoreForm onReturn={() => navigateTo('dashboard')} />
          </ComponentLoader>
        );
      case 'joinSeason':
        return (
          <ComponentLoader>
            <JoinSeasonForm onReturn={() => navigateTo('dashboard')} />
          </ComponentLoader>
        );
      case 'profile':
        return (
          <ComponentLoader>
            <ProfileForm onReturn={() => navigateTo('dashboard')} />
          </ComponentLoader>
        );
      case 'createGame':
        return (
          <ComponentLoader>
            <CreateGameForm onReturn={() => navigateTo('dashboard')} />
          </ComponentLoader>
        );
      case 'manageScores':
        return (
          <ComponentLoader>
            <ManageScoresView onReturn={() => navigateTo('dashboard')} />
          </ComponentLoader>
        );
      case 'bonusRecalculate':
          return (
            <ComponentLoader>
              <BonusPointRecalculation onReturn={() => navigateTo('dashboard')} />
            </ComponentLoader>
      );
      case 'viewCodes':
        return (
          <ComponentLoader>
            <ManageGamesView onReturn={() => navigateTo('dashboard')} />
          </ComponentLoader>
        );
      default:
        return (
          <ComponentLoader>
            <DashboardView 
              isAdmin={isAdmin}
              onNavigate={navigateTo}
            />
          </ComponentLoader>
        );
    }
  };

  return (
    <ComponentLoader>
      <MainLayout>
        {renderView()}
      </MainLayout>
    </ComponentLoader>
  );
}