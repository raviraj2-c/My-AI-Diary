import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import {
  LogOut,
  Settings,
  LifeBuoy,
  ChevronDown,
  Moon,
  Sun,
  GraduationCap,
  BookOpen,
  Mail,
  Archive,
  Download,
  ShieldCheck
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useSettings } from '../../hooks/useSettings';
import { useToast } from './Toast';

interface HeaderProps {
  onMenuClick?: () => void;
}

export const Header: React.FC<HeaderProps> = () => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const { settings, updateSettings } = useSettings();
  const { info } = useToast();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleTheme = () => {
    const nextTheme = settings.theme === 'dark' ? 'light' : 'dark';
    updateSettings({ theme: nextTheme });
    info(`Switched to ${nextTheme} theme`);
  };

  const handleSosClick = () => {
    window.dispatchEvent(new CustomEvent('minddiary_open_sos'));
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.slice(0, 2).toUpperCase();
  };

  const menuItems = [
    { label: t('nav.settings', 'Settings'), href: '/settings', icon: Settings },
    { label: t('nav.student', 'Student'), href: '/student', icon: GraduationCap },
    { label: t('nav.stories', 'Stories'), href: '/stories', icon: BookOpen },
    { label: t('nav.letters', 'Letters'), href: '/letters', icon: Mail },
    { label: t('happybox.title', 'Happy Box'), href: '/happy-box', icon: Archive },
    { label: t('nav.export', 'Export'), href: '/export', icon: Download },
    { label: t('privacy.title', 'Privacy'), href: '/privacy', icon: ShieldCheck },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 h-16 z-40 bg-surface border-b border-border transition-colors">
      <div className="h-full max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-2">
        {/* App Name */}
        <Link
          to="/"
          className="flex items-center gap-2 rounded-card p-1 text-text font-semibold text-lg tracking-tight shrink-0"
        >
          <span>🌿</span>
          <span>{t('common.appName')}</span>
        </Link>

        {/* Right actions: SOS pill + Theme + Avatar Menu */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSosClick}
            aria-label={t('sos.button', 'SOS')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-chip text-xs font-semibold bg-danger text-white border border-danger hover:bg-danger/90 transition-colors shrink-0"
          >
            <LifeBuoy size={16} strokeWidth={1.75} />
            <span>{t('sos.button', 'SOS')}</span>
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            aria-label={settings.theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="p-2 rounded-card text-muted hover:text-text hover:bg-sky-50 dark:hover:bg-ink-800 transition-colors shrink-0"
          >
            {settings.theme === 'dark' ? (
              <Sun size={20} strokeWidth={1.75} className="text-sky-400" />
            ) : (
              <Moon size={20} strokeWidth={1.75} />
            )}
          </button>

          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen((prev) => !prev)}
              aria-label="User account menu"
              aria-expanded={dropdownOpen}
              className="flex items-center gap-2 p-1.5 rounded-card hover:bg-sky-50 dark:hover:bg-ink-800 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-sky-100 dark:bg-ink-900 text-sky-700 dark:text-sky-400 font-semibold text-xs flex items-center justify-center border border-border">
                {getInitials(user?.name)}
              </div>
              <span className="hidden sm:inline-block text-xs font-semibold text-text max-w-[120px] truncate">
                {user?.name}
              </span>
              <ChevronDown size={16} strokeWidth={1.75} className="text-muted" />
            </button>

            {dropdownOpen && (
              <div
                role="menu"
                aria-label="Account menu"
                className="absolute right-0 mt-2 w-56 bg-surface rounded-card border border-border p-1.5 z-50 animate-slide-up text-left"
              >
                <div className="px-3 py-2 border-b border-border mb-1">
                  <p className="text-xs font-semibold text-text truncate">{user?.name}</p>
                  <p className="text-xs text-muted truncate">{user?.email}</p>
                </div>

                {menuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.href}
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setDropdownOpen(false);
                        navigate(item.href);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-card text-xs font-semibold text-text hover:bg-sky-50 dark:hover:bg-ink-800 transition-colors"
                    >
                      <Icon size={16} strokeWidth={1.75} className="text-sky-500" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}

                <div className="my-1 border-t border-border" />
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setDropdownOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-card text-xs font-semibold text-danger hover:bg-sky-50 dark:hover:bg-ink-800 transition-colors"
                >
                  <LogOut size={16} strokeWidth={1.75} />
                  <span>{t('nav.logout', 'Log out')}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
