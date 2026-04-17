import React, { ReactNode, useState, useCallback } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { useSettings } from '../../hooks/useSettings';

interface LayoutProps {
  children: ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { settings } = useSettings();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const openSidebar = useCallback(() => setIsSidebarOpen(true), []);
  const closeSidebar = useCallback(() => setIsSidebarOpen(false), []);

  const themeClasses = {
    light: 'bg-gray-50 text-gray-900',
    dark: 'bg-gray-900 text-gray-100'
  };

  const fontSizeClasses = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg'
  };

  const fontFamilyClasses = {
    inter: 'font-sans',
    serif: 'font-serif',
    mono: 'font-mono'
  };

  return (
    <div
      className={`min-h-screen ${themeClasses[settings.theme]} ${fontSizeClasses[settings.fontSize]} ${fontFamilyClasses[settings.fontFamily]}`}
    >
      
      <Header onMenuClick={openSidebar} />

      <div className="flex pt-16">
        <div className="hidden lg:block lg:w-64 fixed top-16 left-0 h-[calc(100vh-4rem)] border-r border-gray-200 dark:border-gray-700">
          <Sidebar isOpen={true} onClose={closeSidebar} />
        </div>

      
        <div className="lg:hidden">
          <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
        </div>

        <main
          className={`flex-1 p-4 sm:p-6 md:p-8 w-full ${'lg:ml-64'}`}
        >
          {children}
        </main>
      </div>
    </div>
  );
};
