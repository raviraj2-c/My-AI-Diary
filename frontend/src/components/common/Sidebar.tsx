import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Home,
  PenTool,
  Calendar,
  Settings,
  Sparkles,
  HeartHandshake,
  TrendingUp,
  Wind,
  ShieldCheck,
  Bot,
  GraduationCap,
  BookOpen,
  MessageSquareQuote,
  LayoutGrid,
  Mail
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const { t } = useTranslation();

  const navigation = [
    { nameKey: 'nav.home', defaultName: 'Home', href: '/', icon: Home },
    { nameKey: 'nav.write', defaultName: 'Write', href: '/write', icon: PenTool },
    { nameKey: 'checkin.title', defaultName: 'Daily Check-In', href: '/checkin', icon: HeartHandshake },
    { nameKey: 'nav.pixels', defaultName: 'Year in Pixels', href: '/pixels', icon: LayoutGrid },
    { nameKey: 'nav.letters', defaultName: 'Future Letters', href: '/letters', icon: Mail },
    { nameKey: 'nav.student', defaultName: 'Student Focus', href: '/student', icon: GraduationCap },
    { nameKey: 'nav.chat', defaultName: 'AI Companion', href: '/chat', icon: Bot },
    { nameKey: 'nav.ask', defaultName: 'Ask My Diary', href: '/ask', icon: MessageSquareQuote },
    { nameKey: 'nav.stories', defaultName: 'Storybooks', href: '/stories', icon: BookOpen },
    { nameKey: 'nav.calm', defaultName: 'Calm Space', href: '/calm', icon: Wind },
    { nameKey: 'nav.insights', defaultName: 'Wellness Insights', href: '/insights', icon: TrendingUp },
    { nameKey: 'nav.calendar', defaultName: 'Calendar', href: '/calendar', icon: Calendar },
    { nameKey: 'privacy.title', defaultName: 'Privacy Policy', href: '/privacy', icon: ShieldCheck },
    { nameKey: 'nav.settings', defaultName: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <aside
      aria-label="Desktop sidebar navigation"
      className="hidden md:flex flex-col w-64 fixed top-16 left-0 bottom-0 bg-white dark:bg-[#131d31] border-r border-gray-200/80 dark:border-gray-800/80 p-4 transition-colors z-30 overflow-y-auto"
    >
      <div className="flex-1 space-y-1">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;
          const label = t(item.nameKey, item.defaultName);
          return (
            <Link
              key={item.href}
              to={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-calm-100 text-calm-900 dark:bg-calm-950/70 dark:text-calm-200 shadow-soft-sm font-semibold'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100/70 dark:hover:bg-gray-800/60'
              }`}
            >
              <Icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? 'text-calm-700 dark:text-calm-400' : 'text-gray-400 dark:text-gray-500'}`} />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
      </div>

      {/* Gentle encouragement prompt box */}
      <div className="mt-3 p-3.5 rounded-2xl bg-calm-50 dark:bg-calm-950/40 border border-calm-200/50 dark:border-calm-900/60 text-left shrink-0">
        <div className="flex items-center gap-2 mb-1 text-calm-700 dark:text-calm-300">
          <Sparkles className="h-4 w-4 shrink-0" />
          <span className="text-xs font-semibold">{t('sidebar.mindfulSpace')}</span>
        </div>
        <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
          {t('sidebar.mindfulSpaceDesc')}
        </p>
      </div>
    </aside>
  );
};
