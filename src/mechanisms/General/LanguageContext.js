import React, { createContext, useContext, useState } from 'react';
import { translations as enTranslations } from '../../translations/en';
import { translations as idTranslations } from '../../translations/id';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('en');

  const translations = {
    en: enTranslations,
    id: idTranslations
  };

  const translate = (key) => {
    try {
      const keys = key.split('.');
      let translation = translations[language];
      for (const k of keys) {
        translation = translation[k];
      }
      return translation || key;
    } catch (err) {
      return key;
    }
  };

  const value = {
    language,
    setLanguage,
    translate
  };

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
