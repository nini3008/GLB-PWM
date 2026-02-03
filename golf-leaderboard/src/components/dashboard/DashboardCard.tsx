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
    bg: 'bg-slate-50',
    hover: 'hover:bg-slate-100',
    iconBg: 'bg-slate-200',
    iconText: 'text-slate-600',
  };

  const userColors = {
    bg: 'bg-white',
    hover: 'hover:bg-slate-50',
    iconBg: 'bg-emerald-50',
    iconText: 'text-emerald-600',
  };

  const colors = isAdmin ? adminColors : userColors;

  return (
    <div
      className={`${colors.bg} ${colors.hover} rounded-xl border border-slate-200 transition-all duration-200 cursor-pointer overflow-hidden group`}
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
