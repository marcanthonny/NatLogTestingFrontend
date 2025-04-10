import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { WEEKLY_CONFIG, getWeekForDate } from '../config/weeklyConfig';
import axios from 'axios';

const VALID_BRANCHES = [
  '1982 - PT. APL JAYAPURA',
  '1981 - PT. APL KUPANG',
  '1980 - PT. APL DENPASAR',
  '1972 - PT. APL PONTIANAK',
  '1971 - PT. APL SAMARINDA',
  '1970 - PT. APL BANJARMASIN',
  '1962 - PT. APL PALU',
  '1961 - PT. APL MAKASSAR',
  '1957 - PT. APL BANDAR LAMPUNG',
  '1956 - PT. APL PALEMBANG',
  '1955 - PT. APL JAMBI',
  '1954 - PT. APL BATAM',
  '1953 - PT. APL PEKANBARU',
  '1952 - PT. APL PADANG',
  '1951 - PT. APL MEDAN',
  '1940 - PT. APL SURABAYA',
  '1932 - PT. APL YOGYAKARTA',
  '1930 - PT. APL SEMARANG',
  '1922 - PT. APL BANDUNG',
  '1921 - PT. APL TANGERANG',
  '1920 - PT. APL BOGOR',
  '1910 - PT. APL JAKARTA 1',
  '1960 - PT. APL MANADO' 
];

const getBranchShortName = (fullName) => {
  const parts = fullName.split(' - ');
  if (parts.length > 1) {
    return parts[1].replace('PT. APL ', '');
  }
  return fullName;
};

export const useIraCcDashboardLogic = ({ iraData, ccData, snapshotInfo }) => {
  const [iraStats, setIraStats] = useState({
    counted: 0,
    notCounted: 0,
    percentage: 0,
    branchPercentages: []
  });
  const [ccStats, setCcStats] = useState({
    counted: 0,
    notCounted: 0,
    percentage: 0,
    branchPercentages: []
  });
  const [currentWeek, setCurrentWeek] = useState(null);
  const [weekSettings, setWeekSettings] = useState(null); // Define weekSettings state
  const [availablePeriods, setAvailablePeriods] = useState([]); // Define availablePeriods state
  const [selectedPeriod, setSelectedPeriod] = useState(''); // Define selectedPeriod state
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null); // Define success state
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedSettings = localStorage.getItem('weekTargetSettings');
    if (savedSettings) {
      try {
        setWeekSettings(JSON.parse(savedSettings));
      } catch (e) {
        console.error('Error parsing saved week settings:', e);
      }
    }
  }, []);

  useEffect(() => {
    if (!weekSettings) return;
    
    const today = new Date();
    const ccWeeks = weekSettings.cc;
    const iraWeeks = weekSettings.ira;
    
    const isInRange = (startDate, endDate) => {
      if (!startDate || !endDate) return false;
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      return today >= start && today <= end;
    };
    
    const currentWeeks = {
      cc: null,
      ira: null
    };
    
    ['week1', 'week2', 'week3', 'week4'].forEach(week => {
      if (isInRange(ccWeeks[week].startDate, ccWeeks[week].endDate)) {
        currentWeeks.cc = {
          week,
          target: ccWeeks[week].target,
          startDate: ccWeeks[week].startDate,
          endDate: ccWeeks[week].endDate
        };
      }
      
      if (isInRange(iraWeeks[week].startDate, iraWeeks[week].endDate)) {
        currentWeeks.ira = {
          week,
          target: iraWeeks[week].target,
          startDate: iraWeeks[week].startDate,
          endDate: iraWeeks[week].endDate
        };
      }
    });
    
    setCurrentWeek(currentWeeks);
  }, [weekSettings]);

  useEffect(() => {
    if (iraData && ccData) {
      setIraStats(processIraData(iraData));
      setCcStats(processCcData(ccData));
    } else if (snapshotInfo) {
      setIraStats(snapshotInfo.iraStats);
      setCcStats(snapshotInfo.ccStats);
    }
  }, [iraData, ccData, snapshotInfo]);

  const processIraData = (data) => {
    if (data.percentage !== undefined && data.branchPercentages !== undefined) {
      return data;
    }

    if (!data || !data.data || data.data.length === 0) return;

    console.log("Processing IRA data for dashboard");
    console.log("IRA data type:", typeof data);
    console.log("IRA data columns:", data.columns);
    console.log("Sample row:", data.data[0]);

    if (data.isPowerBi) {
      const periods = [...new Set(data.data.map(row => row.Period).filter(Boolean))];
      setAvailablePeriods(periods);

      if (periods.length > 0 && !selectedPeriod) {
        setSelectedPeriod(periods[periods.length - 1]);
      }
    }

    const filteredData = data.isPowerBi && selectedPeriod 
      ? data.data.filter(row => row.Period === selectedPeriod)
      : data.data;

    let countedItems = 0;
    let totalItems = 0;

    const branchColumn = data.columns.find(col => 
      col === 'Lbl_Branch' || col === 'Branch' || col === 'Plant'
    ) || 'Lbl_Branch';

    console.log(`Using branch column for IRA data: ${branchColumn}`);

    const branchGroups = {};

    VALID_BRANCHES.forEach(branch => {
      branchGroups[branch] = {
        branch,
        countedItems: 0,
        totalItems: 0
      };
    });

    filteredData.forEach(row => {
      let iraLineValue = row['%IRALine'];

      if (iraLineValue === '1' || iraLineValue === 'true' || iraLineValue === true) {
        iraLineValue = 1;
      } else if (iraLineValue === '0' || iraLineValue === 'false' || iraLineValue === false) {
        iraLineValue = 0;
      } else if (iraLineValue === undefined || iraLineValue === null) {
        iraLineValue = row['Count Status'] === 'Counted' ? 1 : 0;
      } else {
        iraLineValue = Number(iraLineValue);
        if (isNaN(iraLineValue)) iraLineValue = 0;
      }

      totalItems++;

      if (iraLineValue === 1) {
        countedItems++;
      }

      const branch = row[branchColumn];
      if (branch && VALID_BRANCHES.includes(branch)) {
        if (!branchGroups[branch]) {
          branchGroups[branch] = {
            branch,
            countedItems: 0,
            totalItems: 0
          };
        }

        branchGroups[branch].totalItems++;

        if (iraLineValue === 1) {
          branchGroups[branch].countedItems++;
        }
      }
    });

    console.log(`IRA statistics: Counted=${countedItems}, Total=${totalItems}`);

    const branchPercentages = [];

    Object.values(branchGroups).forEach(group => {
      if (group.totalItems > 0) {
        const percentage = (group.countedItems / group.totalItems) * 100;
        branchPercentages.push({
          branch: group.branch,
          percentage: percentage
        });
      }
    });

    const percentage = totalItems > 0 ? (countedItems / totalItems) * 100 : 0;

    return {
      counted: countedItems,
      notCounted: totalItems - countedItems,
      percentage: percentage,
      branchPercentages: branchPercentages
    };
  };

  const processCcData = (data) => {
    if (data.percentage !== undefined && data.branchPercentages !== undefined) {
      return data;
    }

    if (!data || !data.data || data.data.length === 0) return;

    console.log("Processing CC data for dashboard");

    const branchColumnName = data.columns.find(col => 
      col === 'Plant' || col === '!Branch' || col === 'Branch'
    ) || 'Plant';

    console.log("Using branch column for CC data:", branchColumnName);

    const filteredData = data.data.filter(row => row.StorageType !== 'LIVE_PICA');

    let counted = 0;
    let notCounted = 0;

    const branchGroups = {};

    VALID_BRANCHES.forEach(branch => {
      branchGroups[branch] = {
        branch,
        countedItems: 0,
        totalItems: 0
      };
    });

    filteredData.forEach(row => {
      let countCompValue = row['%CountComp'];

      if (countCompValue === '1' || countCompValue === 'true' || countCompValue === true) {
        countCompValue = 1;
      } else if (countCompValue === '0' || countCompValue === 'false' || countCompValue === false) {
        countCompValue = 0;
      } else if (countCompValue === undefined || countCompValue === null) {
        countCompValue = row['Count Status'] === 'Counted' ? 1 : 0;
      } else {
        countCompValue = Number(countCompValue);
        if (isNaN(countCompValue)) countCompValue = 0;
      }

      notCounted++;

      if (countCompValue === 1) {
        counted++;
        notCounted--;
      }

      const branch = row[branchColumnName];
      if (branch && VALID_BRANCHES.includes(branch)) {
        if (!branchGroups[branch]) {
          branchGroups[branch] = {
            branch,
            countedItems: 0,
            totalItems: 0
          };
        }

        branchGroups[branch].totalItems++;

        if (countCompValue === 1) {
          branchGroups[branch].countedItems++;
        }
      }
    });

    console.log(`CC statistics: Counted=${counted}, NotCounted=${notCounted}`);

    const branchPercentages = [];

    Object.values(branchGroups).forEach(group => {
      if (group.totalItems > 0) {
        const percentage = (group.countedItems / group.totalItems) * 100;
        branchPercentages.push({
          branch: group.branch,
          percentage: percentage
        });
      }
    });

    const total = counted + notCounted;
    const percentage = total > 0 ? (counted / total) * 100 : 0;

    return {
      counted,
      notCounted,
      percentage,
      branchPercentages
    };
  };

  const exportAsExcel = () => {
    try {
      const wb = XLSX.utils.book_new();
      const combinedData = [
        ['No.', 'Branch', 'IRA %', 'IRA Status', 'CC %', 'CC Status']
      ];

      const branchesWithData = VALID_BRANCHES.map((branch, index) => {
        const iraBranch = iraStats.branchPercentages.find(b => b.branch === branch);
        const ccBranch = ccStats.branchPercentages.find(b => b.branch === branch);

        return {
          no: index + 1,
          branch,
          ira: iraBranch ? iraBranch.percentage : 0,
          cc: ccBranch ? ccBranch.percentage : 0
        };
      })
      .sort((a, b) => b.cc - a.cc);

      branchesWithData.forEach(branch => {
        const iraStatus = currentWeek?.ira 
          ? (branch.ira >= currentWeek.ira.target ? 'On Target' : 'Below Target')
          : '';
        const ccStatus = currentWeek?.cc 
          ? (branch.cc >= currentWeek.cc.target ? 'On Target' : 'Below Target')
          : '';

        combinedData.push([
          branch.no,
          branch.branch,
          `${branch.ira.toFixed(2)}%`,
          iraStatus,
          `${branch.cc.toFixed(2)}%`,
          ccStatus
        ]);
      });

      const ws = XLSX.utils.aoa_to_sheet(combinedData);
      XLSX.utils.book_append_sheet(wb, ws, 'Combined Report');
      XLSX.writeFile(wb, 'ira-cc-dashboard.xlsx');
    } catch (error) {
      console.error('Error exporting dashboard as Excel:', error);
      alert('Failed to export as Excel. Please try again.');
    }
  };

  const createEmailDraft = async () => {
    try {
      if (!snapshotInfo && (!iraData || !ccData)) {
        setError('No data available to create email draft');
        return;
      }
  
      setLoading(true);
  
      if (snapshotInfo) {
        const response = await axios.post('/api/snapshots/email-draft', {
          snapshotId: snapshotInfo.id
        });
        
        if (response.data.emailUrl) {
          window.open(response.data.emailUrl, '_blank');
        } else {
          throw new Error('No email URL received from server');
        }
      } else {
        const snapshot = {
          id: Date.now().toString(),
          name: `Snapshot ${new Date().toLocaleDateString()}`,
          date: new Date().toISOString(),
          iraStats: iraStats,
          ccStats: ccStats
        };
  
        const saveResponse = await axios.post('/api/snapshots', snapshot);
        
        const emailResponse = await axios.post('/api/snapshots/email-draft', {
          snapshotId: saveResponse.data.id
        });
  
        if (emailResponse.data.emailUrl) {
          window.open(emailResponse.data.emailUrl, '_blank');
        } else {
          throw new Error('No email URL received from server');
        }
      }
  
      setSuccess('Email draft created successfully');
    } catch (error) {
      console.error('Error creating email draft:', error);
      setError('Failed to create email draft: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  return {
    iraStats,
    ccStats,
    currentWeek,
    error,
    loading,
    exportAsExcel,
    createEmailDraft,
    getBranchShortName,
    VALID_BRANCHES
  };
};
