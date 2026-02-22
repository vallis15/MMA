import React, { createContext, useContext, useState, useEffect } from 'react';
import { getTranslation } from '../constants/translations';

export type Language = 'en' | 'cs' | 'pl';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load language from localStorage or default to English
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('mma-language');
    console.log('🔧 [LANGUAGE] Initializing with saved language:', saved);
    return (saved as Language) || 'en';
  });

  // Save language to localStorage when changed
  useEffect(() => {
    console.log('💾 [LANGUAGE] Saving to localStorage:', language);
    localStorage.setItem('mma-language', language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    console.log('🌍 [LANGUAGE] Changing language to:', lang);
    setLanguageState(lang);
    console.log('✅ [LANGUAGE] Language state updated');
  };

  // Translation function
  const t = (key: string): string => {
    return getTranslation(key, language);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
