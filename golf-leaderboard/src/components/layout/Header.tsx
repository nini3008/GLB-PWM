// src/components/layout/Header.tsx
'use client'

import { useState } from 'react';
import { Award, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface HeaderProps {
  username?: string;
  isAdmin?: boolean;
  onLogout: () => void;
}

export default function Header({ username, isAdmin, onLogout }: HeaderProps) {
  const { user } = useAuth();
  const isLoggedIn = !!user;
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-green-900 text-white shadow-md">
      <div className="container mx-auto px-3 py-3 sm:px-4 sm:py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Award className="mr-2 h-5 w-5 sm:h-6 sm:w-6" />
            <h1 className="text-xl sm:text-2xl font-bold">GolfLeaderboard</h1>
          </div>
          
          {/* Mobile menu button */}
          {isLoggedIn && (
            <button 
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden flex items-center"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          )}
          
          {/* Desktop navigation */}
          {isLoggedIn && (
            <div className="hidden md:flex items-center">
              <div className="mr-4 text-sm">
                <span>Welcome, </span>
                <span className="font-semibold">{username}</span>
                {isAdmin && <span className="ml-2 px-2 py-1 bg-yellow-500 text-xs rounded">Admin</span>}
              </div>
              <button 
                onClick={onLogout}
                className="flex items-center bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
              >
                <LogOut className="h-4 w-4 mr-1" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
        
        {/* Mobile dropdown menu */}
        {isLoggedIn && menuOpen && (
          <div className="md:hidden pt-3 pb-2 border-t border-green-600 mt-3 flex flex-col items-start">
            <div className="py-2 text-sm">
              <span>Welcome, </span>
              <span className="font-semibold">{username}</span>
              {isAdmin && <span className="ml-2 px-2 py-1 bg-yellow-500 text-xs rounded">Admin</span>}
            </div>
            <button 
              onClick={onLogout}
              className="flex items-center bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded mt-2 w-full justify-center"
            >
              <LogOut className="h-4 w-4 mr-2" />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}