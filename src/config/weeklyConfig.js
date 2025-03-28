export const WEEKLY_CONFIG = {
  'Week 1': { start: '2024-03-05', end: '2024-03-11', ccTarget: 95, iraTarget: 95 },
  'Week 2': { start: '2024-03-12', end: '2024-03-18', ccTarget: 97, iraTarget: 97 },
  'Week 3': { start: '2024-03-19', end: '2024-03-25', ccTarget: 98, iraTarget: 98 },
  'Week 4': { start: '2024-03-26', end: '2024-04-01', ccTarget: 99, iraTarget: 99 }
};

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
  // If no matching week found, return the last configured week
  const lastWeek = Object.entries(WEEKLY_CONFIG).pop();
  return { week: lastWeek[0], period: lastWeek[1] };
};
