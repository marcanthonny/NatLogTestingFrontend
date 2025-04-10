let WEEKLY_CONFIG = {};

// Load saved configuration or create empty structure
try {
  const savedConfig = localStorage.getItem('weeklyTargets');
  if (savedConfig) {
    WEEKLY_CONFIG = JSON.parse(savedConfig);
  } else {
    WEEKLY_CONFIG = {
      'Week 1': { start: '2024-03-05', end: '2024-03-11', ccTarget: 0, iraTarget: 0 },
      'Week 2': { start: '2024-03-12', end: '2024-03-18', ccTarget: 0, iraTarget: 0 },
      'Week 3': { start: '2024-03-19', end: '2024-03-25', ccTarget: 0, iraTarget: 0 },
      'Week 4': { start: '2024-03-26', end: '2024-04-01', ccTarget: 0, iraTarget: 0 }
    };
    localStorage.setItem('weeklyTargets', JSON.stringify(WEEKLY_CONFIG));
  }
} catch (error) {
  console.error('Error loading saved targets:', error);
}

// Add the missing export function
export const updateWeeklyTargets = (newConfig) => {
  WEEKLY_CONFIG = newConfig;
  localStorage.setItem('weeklyTargets', JSON.stringify(newConfig));
};

export { WEEKLY_CONFIG };

// Helper function to get week for a given date
export const getWeekForDate = (dateStr) => {
  const date = new Date(dateStr);
  for (const [week, period] of Object.entries(WEEKLY_CONFIG)) {
    const start = new Date(period.start);
    const end = new Date(period.end);
    if (date >= start && date <= end) {
      return { week, period };
    }
  }
  const lastWeek = Object.entries(WEEKLY_CONFIG).pop();
  return { week: lastWeek[0], period: lastWeek[1] };
};
