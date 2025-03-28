// src/components/layout/Footer.tsx
'use client'

import React from 'react';
import { Flag, Heart, ShieldCheck } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200 py-6 text-gray-600">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-4 md:mb-0">
            <Flag className="h-5 w-5 text-green-600 mr-2" />
            <span className="text-sm font-medium text-gray-800">GolfLeaderboard</span>
          </div>
          
          {/* <div className="text-center text-xs text-gray-500 mb-4 md:mb-0">
            <div className="flex items-center justify-center space-x-4">
              <a href="#" className="hover:text-green-700 transition-colors">Privacy Policy</a>
              <span className="text-gray-300">|</span>
              <a href="#" className="hover:text-green-700 transition-colors">Terms of Service</a>
              <span className="text-gray-300">|</span>
              <a href="#" className="hover:text-green-700 transition-colors">Help</a>
            </div>
          </div> */}
          
          <div className="flex items-center space-x-2">
            <div className="flex items-center text-xs text-gray-500">
              <ShieldCheck className="h-3.5 w-3.5 text-green-600 mr-1" />
              <span>Secure scoring</span>
            </div>
            <span className="text-gray-300">•</span>
            <div className="flex items-center text-xs text-gray-500">
              <span>Made with</span>
              <Heart className="h-3 w-3 text-red-500 mx-1" />
              <span>© {currentYear}</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}