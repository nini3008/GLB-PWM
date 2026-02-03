// src/components/layout/Header.tsx
'use client'

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, Menu, Flag, LayoutDashboard, Trophy, User, Shield, ChevronDown } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

interface HeaderProps {
  username?: string;
  isAdmin?: boolean;
  onLogout: () => void;
}

const navLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
];

export default function Header({ username, isAdmin, onLogout }: HeaderProps) {
  const { user } = useAuth();
  const isLoggedIn = !!user;
  const [sheetOpen, setSheetOpen] = useState(false);
  const pathname = usePathname();

  const avatarInitial = username?.charAt(0).toUpperCase() || 'U';

  return (
    <header className="bg-gradient-to-r from-slate-800 to-slate-900 text-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="bg-emerald-500 rounded-full p-1.5">
              <Flag className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Golf<span className="font-light">Leaderboard</span>
            </h1>
          </div>

          {/* Mobile menu button - Sheet trigger */}
          {isLoggedIn && (
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <button
                  className="md:hidden flex items-center p-1.5 rounded-lg hover:bg-slate-700 transition-colors duration-200"
                  aria-label="Open menu"
                >
                  <Menu className="h-5 w-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 bg-slate-800 border-slate-700 text-white">
                <SheetHeader>
                  <SheetTitle className="text-white text-left">Menu</SheetTitle>
                </SheetHeader>
                <div className="mt-6 flex flex-col gap-4">
                  {/* User info */}
                  <div className="flex items-center gap-3 pb-4 border-b border-slate-600">
                    <div className="h-10 w-10 rounded-full bg-emerald-600 flex items-center justify-center text-lg font-medium">
                      {avatarInitial}
                    </div>
                    <div>
                      <div className="font-medium">{username}</div>
                      {isAdmin && (
                        <span className="text-xs bg-emerald-500 text-white px-2 py-0.5 rounded-full font-medium">
                          Admin
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Nav links */}
                  <nav className="flex flex-col gap-1">
                    {navLinks.map(({ href, label, icon: Icon }) => (
                      <Link
                        key={href}
                        href={href}
                        onClick={() => setSheetOpen(false)}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors duration-200 ${
                          pathname === href
                            ? 'bg-slate-700 text-white'
                            : 'text-slate-300 hover:bg-slate-700/50'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {label}
                      </Link>
                    ))}
                    <Link
                      href="/profile"
                      onClick={() => setSheetOpen(false)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors duration-200 ${
                        pathname === '/profile'
                          ? 'bg-slate-700 text-white'
                          : 'text-slate-300 hover:bg-slate-700/50'
                      }`}
                    >
                      <User className="h-4 w-4" />
                      Profile
                    </Link>
                  </nav>

                  {/* Logout */}
                  <button
                    onClick={() => {
                      setSheetOpen(false);
                      onLogout();
                    }}
                    className="flex items-center gap-2 bg-slate-600 hover:bg-slate-500 text-white px-3 py-2.5 rounded-lg mt-4 transition-colors duration-200"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </SheetContent>
            </Sheet>
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
                        ? 'bg-slate-700 text-white'
                        : 'text-slate-300 hover:bg-slate-700/50'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Link>
                ))}
              </nav>

              {/* User dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-slate-700/50 transition-colors duration-200">
                    <div className="h-8 w-8 rounded-full bg-emerald-600 flex items-center justify-center">
                      {avatarInitial}
                    </div>
                    <span className="font-medium max-w-24 truncate">{username}</span>
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center gap-2 cursor-pointer">
                      <User className="h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem disabled className="flex items-center gap-2 text-emerald-600">
                      <Shield className="h-4 w-4" />
                      Admin
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={onLogout}
                    className="flex items-center gap-2 text-slate-600 focus:text-slate-700 cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
