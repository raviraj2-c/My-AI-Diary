import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { LogOut, Settings, User as UserIcon, LifeBuoy, ChevronDown, Moon, Sun } from 'lucide-react';
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

  // Close dropdown when clicking outside
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
    // Spot reserved for Part 5 crisis grounding resources
    info('Grounding breath: Inhale gently for 4s, hold for 4s, release for 6s. You are safe.');
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 z-40 bg-white/90 dark:bg-[#131d31]/90 backdrop-blur-md border-b border-gray-200/80 dark:border-gray-800/80 transition-colors">
      <div className="h-full max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Brand */}
        <Link 
          to="/" 
          className="flex items-center gap-2 group transition-transform active:scale-95 focus-visible:ring-2 focus-visible:ring-primary-500 rounded-xl p-1"
        >
          <span className="text-xl">🌿</span>
          <span className="font-bold text-lg sm:text-xl tracking-tight text-gray-900 dark:text-gray-100 group-hover:text-calm-600 dark:group-hover:text-calm-400 transition-colors">
            {t('common.appName')}
          </span>
        </Link>

        {/* Center / Right actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Always-visible SOS spot */}
          <button
            type="button"
            onClick={handleSosClick}
            aria-label={t('sos.button', 'SOS Help')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 transition-all active:scale-95 shadow-soft-sm"
          >
            <LifeBuoy className="h-3.5 w-3.5 animate-pulse" />
            <span>{t('sos.button', 'SOS Help')}</span>
          </button>

          {/* Theme toggle quick button */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={settings.theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="p-2 rounded-xl text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/80 transition-colors"
          >
            {settings.theme === 'dark' ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4 text-slate-600" />
            )}
          </button>

          {/* User Profile Menu */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen((prev) => !prev)}
              aria-label="User account menu"
              aria-expanded={dropdownOpen}
              className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              <div className="w-8 h-8 rounded-full bg-calm-100 dark:bg-calm-900/80 text-calm-800 dark:text-calm-200 font-semibold text-xs flex items-center justify-center border border-calm-200 dark:border-calm-800">
                {getInitials(user?.name)}
              </div>
              <span className="hidden sm:inline-block text-xs font-medium text-gray-700 dark:text-gray-200 max-w-[120px] truncate">
                {user?.name}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-[#131d31] rounded-2xl shadow-soft-lg border border-gray-100 dark:border-gray-800 p-1.5 z-50 animate-slide-up text-left">
                <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-800 mb-1">
                  <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">{user?.name}</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                </div>
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    navigate('/settings');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <Settings className="h-4 w-4 text-gray-400" />
                  <span>{t('nav.settings', 'Settings')}</span>
                </button>
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    navigate('/write');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <UserIcon className="h-4 w-4 text-gray-400" />
                  <span>{t('nav.write', 'Write')}</span>
                </button>
                <div className="my-1 border-t border-gray-100 dark:border-gray-800" />
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>{t('nav.logout', 'Log Out')}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
