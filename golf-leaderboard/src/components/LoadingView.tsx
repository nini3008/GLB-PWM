// src/components/LoadingView.tsx
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { GoalIcon } from 'lucide-react';

interface LoadingViewProps {
  message?: string;
}

export const LoadingView: React.FC<LoadingViewProps> = ({ message = "Loading..." }) => (
  <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-gray-50 flex flex-col items-center justify-center p-4">
    <Card className="w-full max-w-md overflow-hidden backdrop-blur-sm bg-white/90 border-none shadow-xl">
      <div className="bg-gradient-to-r from-green-400 via-green-500 to-green-600 h-1.5" />
      <CardContent className="p-8">
        <div className="flex flex-col items-center space-y-6">
          <div className="relative">
            <div className="h-20 w-20 rounded-full bg-green-50 flex items-center justify-center">
              <GoalIcon className="h-10 w-10 text-green-500" />
            </div>
            <div className="absolute -inset-1 rounded-full border-2 border-t-green-500 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
            <div className="absolute -inset-3 rounded-full border-2 border-t-transparent border-r-green-300 border-b-transparent border-l-green-300 animate-spin animate-reverse animate-slow" />
          </div>
          
          <h2 className="text-xl font-semibold text-center text-gray-800">{message}</h2>
          
          <div className="w-full space-y-3">
            <Skeleton className="h-4 w-full bg-green-100/60 rounded-full" />
            <Skeleton className="h-4 w-3/4 bg-green-100/60 rounded-full" />
            <Skeleton className="h-4 w-1/2 bg-green-100/60 rounded-full" />
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);