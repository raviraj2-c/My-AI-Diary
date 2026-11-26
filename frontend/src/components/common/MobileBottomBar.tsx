import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, BookOpen, Smile, Wind, MessageCircle, Plus } from 'lucide-react';

export const MobileBottomBar: React.FC = () => {
  const location = useLocation();
  const { t } = useTranslation();

  const tabs = [
    { key: 'home', defaultName: 'Home', href: '/', icon: Home },
    { key: 'journal', defaultName: 'Journal', href: '/journal', icon: BookOpen },
    { key: 'mood', defaultName: 'Mood', href: '/mood', icon: Smile },
    { key: 'calm', defaultName: 'Calm', href: '/calm', icon: Wind },
    { key: 'talk', defaultName: 'Talk', href: '/talk', icon: MessageCircle },
  ];

  return (
    <nav
      aria-label="Mobile bottom navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 h-16 z-40 bg-surface border-t border-border px-1 grid grid-cols-5 items-center"
    >
      <Link
        to="/write"
        aria-label={t('nav.write', 'Write')}
        className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-sky-700 text-white border border-surface flex items-center justify-center hover:bg-sky-700/90 transition-colors"
      >
        <Plus size={24} strokeWidth={1.75} />
      </Link>

      {tabs.map((tab) => {
        const isActive =
          tab.href === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(tab.href);
        const Icon = tab.icon;
        const label = t(`nav.${tab.key}`, tab.defaultName);
        return (
          <Link
            key={tab.key}
            to={tab.href}
            aria-label={label}
            aria-current={isActive ? 'page' : undefined}
            className={`flex flex-col items-center justify-center py-1 px-1 rounded-card transition-colors min-w-0 ${
              isActive
                ? 'text-sky-700 dark:text-sky-400 font-semibold'
                : 'text-muted hover:text-text'
            }`}
          >
            <Icon size={20} strokeWidth={1.75} />
            <span className="text-[11px] mt-0.5 truncate max-w-full">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
};
