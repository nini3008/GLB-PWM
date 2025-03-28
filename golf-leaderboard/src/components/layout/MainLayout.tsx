// src/components/layout/MainLayout.tsx
'use client'

import React from 'react';
import Header from './Header';
import Footer from './Footer';
import { useAuth } from '@/context/AuthContext';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { profile, isAdmin, signOut } = useAuth();
  
  const handleLogout = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-50 to-white">
      <Header 
        username={profile?.username} 
        isAdmin={isAdmin} 
        onLogout={handleLogout} 
      />
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 flex-grow">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}