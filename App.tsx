import React, { useState } from 'react';
import { AuthScreen } from './components/AuthScreen';
import { Dashboard } from './components/Dashboard';
import { UserSession, AppView } from './types';
import { AppProvider } from './contexts/AppContext';

export default function App() {
  const [view, setView] = useState<AppView>(AppView.AUTH);
  const [session, setSession] = useState<UserSession | null>(null);

  const handleLogin = (userSession: UserSession) => {
    setSession(userSession);
    setView(AppView.DASHBOARD);
  };

  return (
    <AppProvider>
      {view === AppView.AUTH && <AuthScreen onLogin={handleLogin} />}
      {view === AppView.DASHBOARD && session && <Dashboard session={session} />}
    </AppProvider>
  );
}
