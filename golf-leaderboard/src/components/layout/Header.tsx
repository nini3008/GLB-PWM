// src/components/layout/Header.tsx
'use client'

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, Menu, X, Flag, LayoutDashboard, Trophy, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface HeaderProps {
  username?: string;
  isAdmin?: boolean;
  onLogout: () => void;
}

const navLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/profile', label: 'Profile', icon: User },
];

export default function Header({ username, isAdmin, onLogout }: HeaderProps) {
  const { user } = useAuth();
  const isLoggedIn = !!user;
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="bg-gradient-to-r from-green-800 to-green-700 text-white shadow-lg sticky top-0 z-10">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="bg-white rounded-full p-1.5">
              <Flag className="h-5 w-5 text-green-700" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Golf<span className="font-light">Leaderboard</span>
            </h1>
          </div>
          
          {/* Mobile menu button */}
          {isLoggedIn && (
            <button 
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden flex items-center p-1.5 rounded-lg hover:bg-green-600 transition-colors duration-200"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          )}
          
          {/* Desktop navigation */}
          {isLoggedIn && (
            <div className="hidden md:flex items-center space-x-4">
              <nav className="flex items-center space-x-1">
                {navLinks.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors duration-200 ${
                      pathname === href
                        ? 'bg-green-600 text-white'
                        : 'text-green-100 hover:bg-green-600/50'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Link>
                ))}
              </nav>
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-green-600 flex items-center justify-center mr-2">
                  {username?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <span className="text-green-100 text-xs">Welcome,</span>
                  <div className="font-medium -mt-1">{username}</div>
                </div>
                {isAdmin && (
                  <span className="ml-2 px-2 py-0.5 bg-amber-500 text-amber-900 text-xs rounded-full font-medium">
                    Admin
                  </span>
                )}
              </div>
              <button 
                onClick={onLogout}
                className="flex items-center bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg transition-colors duration-200"
              >
                <LogOut className="h-4 w-4 mr-1.5" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
        
        {/* Mobile dropdown menu */}
        {isLoggedIn && menuOpen && (
          <div className="md:hidden pt-4 pb-3 border-t border-green-600 mt-3 flex flex-col items-start">
            <nav className="flex flex-col w-full space-y-1 mb-3">
              {navLinks.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors duration-200 ${
                    pathname === href
                      ? 'bg-green-600 text-white'
                      : 'text-green-100 hover:bg-green-600/50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              ))}
            </nav>
            <div className="py-2 flex items-center">
              <div className="h-8 w-8 rounded-full bg-green-600 flex items-center justify-center mr-2">
                {username?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <span className="text-green-100 text-xs">Welcome,</span>
                <div className="font-medium -mt-1">{username}</div>
              </div>
              {isAdmin && (
                <span className="ml-2 px-2 py-0.5 bg-amber-500 text-amber-900 text-xs rounded-full font-medium">
                  Admin
                </span>
              )}
            </div>
            <button 
              onClick={onLogout}
              className="flex items-center bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg mt-3 w-full justify-center transition-colors duration-200"
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