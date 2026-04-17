import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useDiary } from '../hooks/useDiary';
import { StorybookExport } from '../components/Export/StorybookExport';

import { Download, FileText } from 'lucide-react';

export const ExportPage: React.FC = () => {
  const { user } = useAuth();
  const { entries } = useDiary(user?.id || '');

  

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Export Your Diary</h1>
          <p className="text-gray-600 mt-2">
            Transform your entries into beautiful stories or export your raw data
          </p>
        </div>
        
        
      </div>

      <StorybookExport entries={entries} />

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Options</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <h4 className="font-medium text-gray-900">PDF Storybook</h4>
            </div>
            <p className="text-sm text-gray-600">
              AI-generated stories with beautiful formatting, ready for printing or sharing.
            </p>
          </div>
          
          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <Download className="h-5 w-5 text-gray-600" />
              <h4 className="font-medium text-gray-900">Raw Data Export</h4>
            </div>
            <p className="text-sm text-gray-600">
              Export your diary entries as JSON for backup or migration purposes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};