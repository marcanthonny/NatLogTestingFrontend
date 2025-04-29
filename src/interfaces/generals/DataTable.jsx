import React from 'react';
import { useLanguage } from '../../mechanisms/General/LanguageContext';

export const DataTable = ({ data, columns }) => {
  const { translate } = useLanguage();

  if (!data || !data.length) {
    return (
      <div className="alert alert-info">
        {translate('common.noData')}
      </div>
    );
  }

  return (
    <div className="table-responsive">
      <table className="table">
        <thead>
          <tr>
            {columns.map((column, index) => (
              <th key={index}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {columns.map((column, colIndex) => (
                <td key={colIndex}>{row[column]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="d-flex justify-content-between align-items-center">
        <div>
          {translate('common.rowsPerPage')}: {data.length}
        </div>
        <div>
          {translate('common.of')}: {data.length} {translate('common.rows')}
        </div>
      </div>
    </div>
  );
};
