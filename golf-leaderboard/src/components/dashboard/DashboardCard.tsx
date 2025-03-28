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
  const adminColors = {
    bg: 'bg-amber-50',
    hover: 'hover:bg-amber-100',
    iconBg: 'bg-amber-100',
    iconText: 'text-amber-600',
    border: 'border-amber-400',
    badge: 'bg-amber-100 text-amber-800'
  };
  
  const userColors = {
    bg: 'bg-green-50',
    hover: 'hover:bg-green-100',
    iconBg: 'bg-green-100',
    iconText: 'text-green-600',
    border: 'border-green-400',
    badge: ''
  };
  
  const colors = isAdmin ? adminColors : userColors;
  
  return (
    <div
      className={`${colors.bg} ${colors.hover} rounded-xl shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer overflow-hidden group`}
      onClick={onClick}
    >
      <div className={`h-1 w-full ${colors.border}`}></div>
      <div className="p-6">
        <div className="flex items-start">
          <div className={`p-3 rounded-full mr-4 ${colors.iconBg} ${colors.iconText} transform group-hover:scale-110 transition-transform duration-300`}>
            {icon}
          </div>
          <div>
            <h3 className="font-bold text-lg text-gray-800 mb-1">{title}</h3>
            <p className="text-gray-600 text-sm">{description}</p>
            {isAdmin && (
              <span className={`text-xs ${colors.badge} px-2 py-1 rounded-full mt-2 inline-block font-medium`}>
                Admin
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}