import { getWeekForDate } from './weeklyTargets';

export const isOnTarget = (value, type, date) => {
  const weekConfig = getWeekForDate(date || new Date().toISOString());
  if (!weekConfig) return false;
  
  const target = type === 'ira' ? weekConfig.period.iraTarget : weekConfig.period.ccTarget;
  return value >= target;
};

export const getBranchShortName = (fullName) => {
  const parts = fullName.split(' - ');
  if (parts.length > 1) {
    return parts[1].replace('PT. APL ', '');
  }
  return fullName;
};

// ...other utility functions...
