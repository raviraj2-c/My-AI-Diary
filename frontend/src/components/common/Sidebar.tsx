import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  PenTool,
  Calendar,
  Search,
  BookOpen,
  Settings
} from 'lucide-react';
import { useSettings } from '../../hooks/useSettings';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { settings } = useSettings();

  const themeClasses = {
    light: 'bg-white border-gray-200 text-gray-900',
    dark: 'bg-gray-800 border-gray-700 text-gray-100'
  };

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Write Entry', href: '/write', icon: PenTool },
    { name: 'Calendar', href: '/calendar', icon: Calendar },
    { name: 'Search', href: '/search', icon: Search },
    { name: 'Storybook', href: '/export', icon: BookOpen },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <>
       
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity md:hidden ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      
      <div
        className={`fixed left-0 top-16 h-screen w-64 ${themeClasses[settings.theme]} border-r shadow-sm z-50 transform transition-transform duration-200
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static md:top-auto overflow-y-auto`}
      >
        <nav className="p-4">
          <ul className="space-y-2">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;
              return (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    onClick={onClose}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </>
  );
};
