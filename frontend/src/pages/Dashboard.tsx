import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useDiary } from '../hooks/useDiary';
import { PenTool, BookOpen, Calendar, TrendingUp } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { entries } = useDiary(user?.id || '');

  const recentEntries = entries.slice(0, 5);
  const totalEntries = entries.length;
  const thisMonth = new Date().getMonth();
  const thisYear = new Date().getFullYear();
  const entriesThisMonth = entries.filter(entry => 
    entry.date.getMonth() === thisMonth && entry.date.getFullYear() === thisYear
  ).length;

  const moodCounts = entries.reduce((acc, entry) => {
    acc[entry.mood] = (acc[entry.mood] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0];

  const quickActions = [
    {
      title: 'Write New Entry',
      description: 'Capture your thoughts and feelings',
      icon: PenTool,
      link: '/write',
      color: 'bg-blue-500'
    },
    {
      title: 'View Calendar',
      description: 'Browse your entries by date',
      icon: Calendar,
      link: '/calendar',
      color: 'bg-green-500'
    },
    {
      title: 'Generate Storybook',
      description: 'Create AI-powered stories',
      icon: BookOpen,
      link: '/export',
      color: 'bg-purple-500'
    }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-gray-600">
          Ready to continue your diary journey?
        </p>
      </div>

       
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Entries</p>
              <p className="text-2xl font-bold text-gray-900">{totalEntries}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <PenTool className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">This Month</p>
              <p className="text-2xl font-bold text-gray-900">{entriesThisMonth}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Most Common Mood</p>
              <p className="text-2xl font-bold text-gray-900 capitalize">
                {topMood ? topMood[0] : 'N/A'}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <span className="text-2xl">😊</span>
            </div>
          </div>
        </div>
      </div>

       
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map(action => (
            <Link
              key={action.title}
              to={action.link}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center mb-4`}>
                <action.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{action.title}</h3>
              <p className="text-gray-600 text-sm">{action.description}</p>
            </Link>
          ))}
        </div>
      </div>

     
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Recent Entries</h2>
          <Link
            to="/search"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            View All
          </Link>
        </div>
        
        {recentEntries.length > 0 ? (
          <div className="bg-white rounded-lg shadow-md">
            {recentEntries.map((entry, index) => (
              <div
                key={entry.id}
                className={`p-4 ${index < recentEntries.length - 1 ? 'border-b' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{entry.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {entry.date.toLocaleDateString()} • {entry.mood}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {entry.tags.slice(0, 3).map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-500 mb-4">No entries yet. Start your diary journey!</p>
            <Link
              to="/write"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <PenTool className="h-4 w-4" />
              Write Your First Entry
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};