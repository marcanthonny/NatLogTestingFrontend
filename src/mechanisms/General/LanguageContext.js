import React, { createContext, useContext, useState } from 'react';

const LanguageContext = createContext();

export function LanguageProvider({ children, value }) {
  const [language, setLanguage] = useState(value?.language || 'en');

  const toggleLanguage = value?.toggleLanguage || (() => {
    setLanguage(prev => prev === 'en' ? 'id' : 'en');
  });

  const contextValue = value || { language, toggleLanguage };

  return (
    <LanguageContext.Provider value={contextValue}>
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
