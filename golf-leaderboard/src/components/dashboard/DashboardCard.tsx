'use client'
// src/components/dashboard/DashboardCard.tsx
import React from 'react';

interface DashboardCardProps {
  title: string;
  icon: React.ReactNode;
  description?: string;
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
  };

  const userColors = {
    bg: 'bg-green-50',
    hover: 'hover:bg-green-100',
    iconBg: 'bg-green-100',
    iconText: 'text-green-600',
  };

  const colors = isAdmin ? adminColors : userColors;

  return (
    <div
      className={`${colors.bg} ${colors.hover} rounded-xl border border-gray-100 transition-all duration-300 cursor-pointer overflow-hidden group`}
      onClick={onClick}
    >
      <div className="p-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-full ${colors.iconBg} ${colors.iconText} transform group-hover:scale-110 transition-transform duration-300`}>
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-800">{title}</h3>
            {description && (
              <p className="text-gray-500 text-sm truncate">{description}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
