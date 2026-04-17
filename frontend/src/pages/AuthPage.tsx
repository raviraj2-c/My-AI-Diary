import React, { useState } from 'react';
import { LoginForm } from '../components/Auth/LoginForm';
import { SignUpForm } from '../components/Auth/SignUpForm';
import { ForgotPassword } from '../components/Auth/ForgotPassword';
import { BookOpen } from 'lucide-react';

export const AuthPage: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <BookOpen className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">MyDiary AI</h1>
          </div>
          <p className="text-gray-600">
            Your personal diary with AI-powered storytelling
          </p>
        </div>

        {mode === 'login' && (
          <LoginForm
            onToggleForm={() => setMode('signup')}
            onForgotPassword={() => setMode('forgot')}
          />
        )}

        {mode === 'signup' && (
          <SignUpForm
            onToggleForm={() => setMode('login')}
          />
        )}

        {mode === 'forgot' && (
          <ForgotPassword
            onBack={() => setMode('login')}
          />
        )}
      </div>
    </div>
  );
};