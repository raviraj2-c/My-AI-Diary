import React, { useState } from 'react';
import { DiaryEntry, StorybookExport as StorybookExportType } from '../../types';
import { AIService } from '../../services/aiService';
import { ExportService } from '../../services/exportService';
import { BookOpen, Download, FileText, Wand2 } from 'lucide-react';

interface StorybookExportProps {
  entries: DiaryEntry[];
}

const themes = [
  { value: 'romantic', label: 'Romantic', description: 'Transform your entries into love stories' },
  { value: 'dramatic', label: 'Dramatic', description: 'Add emotional depth and intensity' },
  { value: 'adventure', label: 'Adventure', description: 'Turn your experiences into epic journeys' },
  { value: 'mystery', label: 'Mystery', description: 'Add intrigue and suspense to your stories' },
  { value: 'comedy', label: 'Comedy', description: 'Highlight the funny moments in your life' },
];

export const StorybookExport: React.FC<StorybookExportProps> = ({ entries }) => {
  const [selectedTheme, setSelectedTheme] = useState<string>('dramatic');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [storybook, setStorybook] = useState<StorybookExportType | null>(null);

  const handleGenerate = async () => {
    if (!startDate || !endDate) {
      alert('Please select both start and end dates');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) {
      alert('Start date must be before end date');
      return;
    }

    const filteredEntries = entries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= start && entryDate <= end;
    });

    if (filteredEntries.length === 0) {
      alert('No entries found in the selected date range');
      return;
    }

    setIsGenerating(true);
    try {
      const generatedStorybook = await AIService.generateStorybook(
        filteredEntries,
        selectedTheme as any,
        { start, end }
      );
      setStorybook(generatedStorybook);
    } catch (error) {
      console.error('Error generating storybook:', error);
      alert('Failed to generate storybook. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportPDF = async () => {
    if (!storybook) return;
    
    try {
      await ExportService.exportToPDF(storybook);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Failed to export PDF. Please try again.');
    }
  };

  const handleExportText = () => {
    if (!storybook) return;
    
    try {
      ExportService.exportToText(storybook);
    } catch (error) {
      console.error('Error exporting text:', error);
      alert('Failed to export text. Please try again.');
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <BookOpen className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">AI Storybook Generator</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Theme
            </label>
            <div className="space-y-2">
              {themes.map(theme => (
                <label key={theme.value} className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="theme"
                    value={theme.value}
                    checked={selectedTheme === theme.value}
                    onChange={(e) => setSelectedTheme(e.target.value)}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-medium text-gray-900">{theme.label}</div>
                    <div className="text-sm text-gray-500">{theme.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Period
            </label>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Wand2 className="h-5 w-5" />
              )}
              {isGenerating ? 'Generating...' : 'Generate Storybook'}
            </button>
          </div>
        </div>
      </div>

      {storybook && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">{storybook.title}</h3>
            <div className="flex gap-2">
              <button
                onClick={handleExportPDF}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export PDF
              </button>
              <button
                onClick={handleExportText}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Export Text
              </button>
            </div>
          </div>

          <div className="prose prose-sm max-w-none">
            <div
              className="whitespace-pre-wrap text-gray-700"
              dangerouslySetInnerHTML={{ __html: storybook.generatedContent.replace(/\n/g, '<br>') }}
            />
          </div>
        </div>
      )}
    </div>
  );
};