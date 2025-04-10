import { getWeekForDate } from './weeklyTargets';

export const calculateTargetStatus = (value, type, date, weeklyConfig) => {
  const weekInfo = getWeekForDate(date || new Date().toISOString(), weeklyConfig);
  if (!weekInfo) return false;
  
  const target = type === 'ira' ? weekInfo.period.iraTarget : weekInfo.period.ccTarget;
  return {
    isOnTarget: value >= target,
    target,
    value,
    week: weekInfo.week
  };
};
