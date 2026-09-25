
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define supported languages
export type Language = 'en' | 'es' | 'ca';

// Define context type
type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
};

// Create context with default values
const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key: string) => key,
});

// Language provider component
export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  // Get initial language from localStorage or use browser language or default to English
  const getInitialLanguage = (): Language => {
    if (typeof window === 'undefined') return 'en';
    
    const storedLanguage = localStorage.getItem('language') as Language;
    if (storedLanguage && ['en', 'es', 'ca'].includes(storedLanguage)) {
      return storedLanguage;
    }
    
    const browserLanguage = navigator.language.split('-')[0];
    if (browserLanguage === 'es' || browserLanguage === 'ca') {
      return browserLanguage as Language;
    }
    
    return 'en';
  };

  const [language, setLanguage] = useState<Language>(getInitialLanguage);

  // Update localStorage when language changes
  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  // Translation function
  const t = (key: string, params?: Record<string, string | number>): string => {
    if (typeof window === 'undefined') return key;
    
    // Get translation from global translations object
    let translation = window.translations?.[language]?.[key] || 
                       window.translations?.['en']?.[key] || 
                       key;
    
    // Replace {year} with current year
    translation = translation.replace('{year}', new Date().getFullYear().toString());
    
    // Replace all parameters like {count}, {name}, etc.
    if (params) {
      Object.keys(params).forEach(paramKey => {
        const placeholder = `{${paramKey}}`;
        // Use split/join instead of regex to avoid special character issues
        translation = translation.split(placeholder).join(String(params[paramKey]));
      });
    }
                         
    return translation;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Custom hook for using the language context
export const useLanguage = () => useContext(LanguageContext);
