import React from 'react';
import { useLanguage } from '../../mechanisms/General/LanguageContext';

export const LoadingSpinner = ({ size = "medium" }) => {
  const { translate } = useLanguage();
  
  return (
    <div className="text-center p-3">
      <div className={`spinner-border text-primary spinner-border-${size}`}>
        <span className="visually-hidden">{translate('common.loading')}</span>
      </div>
      <p className="mt-2">{translate('common.loading')}</p>
    </div>
  );
};
