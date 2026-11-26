import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, PenTool, Calendar, TrendingUp, Wind, Settings } from 'lucide-react';

export const MobileBottomBar: React.FC = () => {
  const location = useLocation();
  const { t } = useTranslation();

  const tabs = [
    { key: 'home', defaultName: 'Home', href: '/', icon: Home },
    { key: 'write', defaultName: 'Write', href: '/write', icon: PenTool },
    { key: 'calendar', defaultName: 'Calendar', href: '/calendar', icon: Calendar },
    { key: 'insights', defaultName: 'Insights', href: '/insights', icon: TrendingUp },
    { key: 'calm', defaultName: 'Calm', href: '/calm', icon: Wind },
    { key: 'more', defaultName: 'More', href: '/settings', icon: Settings },
  ];

  return (
    <nav
      aria-label="Mobile bottom navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 h-16 z-40 bg-white/95 dark:bg-[#131d31]/95 backdrop-blur-md border-t border-gray-200/80 dark:border-gray-800/80 px-2 flex items-center justify-around shadow-soft-lg"
    >
      {tabs.map((tab) => {
        const isActive = location.pathname === tab.href;
        const Icon = tab.icon;
        const label = t(`nav.${tab.key}`, tab.defaultName);
        return (
          <Link
            key={tab.key}
            to={tab.href}
            aria-label={label}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-150 min-w-[50px] ${
              isActive
                ? 'text-calm-700 dark:text-calm-400 font-semibold scale-105'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <Icon className={`h-5 w-5 ${isActive ? 'stroke-[2.3]' : 'stroke-[1.8]'}`} />
            <span className="text-[10px] mt-0.5">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
};
