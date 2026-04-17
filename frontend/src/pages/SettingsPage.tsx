import React from 'react';
import { UserSettings } from '../components/Settings/UserSettings';

export const SettingsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">
          Customize your diary experience
        </p>
      </div>

      <UserSettings />
    </div>
  );
};