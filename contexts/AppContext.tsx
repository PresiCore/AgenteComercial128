import React, { createContext, useContext, useState, useEffect, ReactNode, PropsWithChildren } from 'react';
import { Language, Theme } from '../types';
import { translations } from '../utils/translations';

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: Theme;
  toggleTheme: () => void;
  t: typeof translations['es']; // Type based on Spanish structure
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('es');
  const [theme, setTheme] = useState<Theme>('light');

  // Handle Theme Logic
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const value = {
    language,
    setLanguage,
    theme,
    toggleTheme,
    t: translations[language]
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};