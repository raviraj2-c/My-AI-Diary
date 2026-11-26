import React, { HTMLAttributes, ReactNode } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  interactive?: boolean;
  padded?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  interactive = false,
  padded = true,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`bg-white dark:bg-[#131d31] border border-gray-100 dark:border-gray-800/80 rounded-2xl shadow-soft-sm transition-all duration-200 ${
        padded ? 'p-5 sm:p-6' : ''
      } ${
        interactive ? 'hover:shadow-soft-md hover:border-gray-200 dark:hover:border-gray-700 cursor-pointer' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
