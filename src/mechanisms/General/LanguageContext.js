import React, { createContext, useContext, useState, useCallback } from 'react';
import { translations as enTranslations } from '../../translations/en';
import { translations as idTranslations } from '../../translations/id';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(localStorage.getItem('language') || 'en');

  const toggleLanguage = useCallback(() => {
    setLanguage(prev => {
      const newLang = prev === 'en' ? 'id' : 'en';
      localStorage.setItem('language', newLang);
      return newLang;
    });
  }, []);

  const translate = useCallback((key) => {
    const translations = language === 'en' ? enTranslations : idTranslations;
    const keys = key.split('.');
    let result = translations;
    
    for (const k of keys) {
      if (result[k] === undefined) {
        console.warn(`Translation missing for key: ${key}`);
        return key;
      }
      result = result[k];
    }
    
    return result;
  }, [language]);

  const value = { language, toggleLanguage, translate };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
