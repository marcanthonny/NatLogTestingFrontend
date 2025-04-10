// Move logic from weeklyConfig.js to here
export const loadWeeklyTargets = () => {
  try {
    const savedConfig = localStorage.getItem('weeklyTargets');
    if (savedConfig) {
      return JSON.parse(savedConfig);
    }
    
    const defaultConfig = {
      'Week 1': { start: '2024-03-05', end: '2024-03-11', ccTarget: 0, iraTarget: 0 },
      'Week 2': { start: '2024-03-12', end: '2024-03-18', ccTarget: 0, iraTarget: 0 },
      'Week 3': { start: '2024-03-19', end: '2024-03-25', ccTarget: 0, iraTarget: 0 },
      'Week 4': { start: '2024-03-26', end: '2024-04-01', ccTarget: 0, iraTarget: 0 }
    };
    
    localStorage.setItem('weeklyTargets', JSON.stringify(defaultConfig));
    return defaultConfig;
  } catch (error) {
    console.error('Error loading targets:', error);
    return null;
  }
};

export const updateWeeklyTargets = (newConfig) => {
  try {
    localStorage.setItem('weeklyTargets', JSON.stringify(newConfig));
    return true;
  } catch (error) {
    console.error('Error saving targets:', error);
    return false;
  }
};

export const getWeekForDate = (dateStr, config) => {
  const date = new Date(dateStr);
  for (const [week, period] of Object.entries(config)) {
    const start = new Date(period.start);
    const end = new Date(period.end);
    if (date >= start && date <= end) {
      return { week, period };
    }
  }
  const lastWeek = Object.entries(config).pop();
  return { week: lastWeek[0], period: lastWeek[1] };
};
