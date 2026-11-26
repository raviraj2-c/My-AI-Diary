import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, BookOpen, Smile, Wind, MessageCircle, Plus } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const { t } = useTranslation();

  const navigation = [
    { nameKey: 'nav.home', defaultName: 'Home', href: '/', icon: Home },
    { nameKey: 'nav.journal', defaultName: 'Journal', href: '/journal', icon: BookOpen },
    { nameKey: 'nav.mood', defaultName: 'Mood', href: '/mood', icon: Smile },
    { nameKey: 'nav.calm', defaultName: 'Calm', href: '/calm', icon: Wind },
    { nameKey: 'nav.talk', defaultName: 'Talk', href: '/talk', icon: MessageCircle },
  ];

  return (
    <aside
      aria-label="Desktop sidebar navigation"
      className="hidden md:flex flex-col items-center w-20 fixed top-16 left-0 bottom-0 bg-surface border-r border-border py-4 px-2 gap-3 transition-colors z-30"
    >
      <Link
        to="/write"
        aria-label={t('nav.write', 'Write')}
        title={t('nav.write', 'Write')}
        className="w-12 h-12 rounded-full bg-sky-700 text-white flex items-center justify-center hover:bg-sky-700/90 transition-colors shrink-0"
      >
        <Plus size={24} strokeWidth={1.75} />
      </Link>

      <nav aria-label="Primary navigation" className="flex-1 flex flex-col items-center gap-2 w-full mt-2">
        {navigation.map((item) => {
          const isActive =
            item.href === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.href);
          const Icon = item.icon;
          const label = t(item.nameKey, item.defaultName);
          return (
            <Link
              key={item.href}
              to={item.href}
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
              className={`w-full flex flex-col items-center justify-center py-2 px-1 rounded-card text-xs transition-colors ${
                isActive
                  ? 'bg-sky-100 text-sky-700 dark:bg-ink-900 dark:text-sky-400 font-semibold'
                  : 'text-muted hover:text-text hover:bg-sky-50 dark:hover:bg-ink-800'
              }`}
            >
              <Icon size={20} strokeWidth={1.75} />
              <span className="mt-1 truncate max-w-full">{label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};
