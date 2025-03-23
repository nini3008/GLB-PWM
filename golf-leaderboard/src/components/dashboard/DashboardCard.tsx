'use client'
// src/components/dashboard/DashboardCard.tsx
import React from 'react';

interface DashboardCardProps {
  title: string;
  icon: React.ReactNode;
  description: string;
  onClick: () => void;
  isAdmin?: boolean;
}

export default function DashboardCard({ 
  title, 
  icon, 
  description, 
  onClick, 
  isAdmin = false 
}: DashboardCardProps) {
  return (
    <div 
      className={`bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer border-l-4 ${isAdmin ? 'border-yellow-500' : 'border-green-500'}`}
      onClick={onClick}
    >
      <div className="flex items-start">
        <div className={`p-3 rounded-full mr-4 ${isAdmin ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'}`}>
          {icon}
        </div>
        <div>
          <h3 className="font-bold text-lg">{title}</h3>
          <p className="text-gray-600 text-sm">{description}</p>
          {isAdmin && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded mt-2 inline-block">Admin Only</span>}
        </div>
      </div>
    </div>
  );
}