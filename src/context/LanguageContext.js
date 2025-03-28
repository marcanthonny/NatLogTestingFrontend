import React from 'react';

export const LanguageContext = React.createContext({
  language: 'en',
  toggleLanguage: () => {}
});

export const LanguageProvider = LanguageContext.Provider;
export const useLanguage = () => React.useContext(LanguageContext);
