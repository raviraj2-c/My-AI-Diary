import React, { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { MobileBottomBar } from './MobileBottomBar';
import { useSettings } from '../../hooks/useSettings';

interface LayoutProps {
  children: ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { settings } = useSettings();
  const { t } = useTranslation();

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
      className={`min-h-screen bg-gray-50 dark:bg-[#0b1120] text-gray-900 dark:text-gray-100 transition-colors duration-200 ${
        fontSizeClasses[settings.fontSize] || 'text-base'
      } ${
        fontFamilyClasses[settings.fontFamily] || 'font-sans'
      }`}
    >
      {/* Skip to Main Content Link for Keyboard Accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-600 focus:text-white focus:rounded-xl focus:shadow-lg focus:outline-none"
      >
        {t('common.skipToMain')}
      </a>

      <Header />

      <div className="flex pt-16">
        <Sidebar />

        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 w-full md:pl-64 min-h-[calc(100vh-4rem)] p-4 sm:p-6 md:p-8 pb-24 md:pb-12 max-w-7xl mx-auto animate-fade-in flex flex-col justify-between"
        >
          <div>{children}</div>
          
          {/* Subtle Universal Healthcare Disclaimer */}
          <footer className="mt-12 pt-6 border-t border-gray-200/60 dark:border-gray-800/60 text-center text-xs text-gray-400 dark:text-gray-500">
            <p>{t('sos.disclaimer')}</p>
          </footer>
        </main>
      </div>

      <MobileBottomBar />
    </div>
  );
};
