import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut, User, Settings, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSettings } from '../../hooks/useSettings';

interface HeaderProps {
  onMenuClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const { settings } = useSettings();

  const themeClasses = {
    light: 'bg-white border-gray-200 text-gray-900',
    dark: 'bg-gray-800 border-gray-700 text-gray-100'
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 ${themeClasses[settings.theme]} border-b shadow-sm`}>
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center gap-3">
          <button
            aria-label="Open menu"
            onClick={onMenuClick}
            className="md:hidden inline-flex items-center justify-center rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Menu className="h-6 w-6" />
          </button>
          <Link to="/" className="text-xl sm:text-2xl font-bold text-blue-600">
            MyDiary AI
          </Link>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden sm:flex items-center gap-2">
            <User className="h-5 w-5" />
            <span className="font-medium max-w-[140px] truncate sm:max-w-none">{user?.name}</span>
          </div>
          
          <Link
            to="/settings"
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Settings"
          >
            <Settings className="h-5 w-5" />
          </Link>
          
          <button
            onClick={logout}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Logout"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
};