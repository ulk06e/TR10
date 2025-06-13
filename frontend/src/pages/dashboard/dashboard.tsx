import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import axios from 'axios';

interface DashboardProps {
  selectedProjectId: string;
  selectedDate: Date;
}

interface DayStats {
  dayXP: number;
  actual_duration: number;
  streak: number;
}

const DashboardColumn: React.FC<DashboardProps> = ({ selectedProjectId, selectedDate }) => {
  const [stats, setStats] = useState<DayStats>({
    dayXP: 0,
    actual_duration: 0,
    streak: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  // For demo: Best values (should be fetched from backend in real app)
  const bestXP = 0;
  const bestTime = 0;

  useEffect(() => {
    fetchStats();
  }, [selectedProjectId, selectedDate]);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`http://localhost:8000/stats/day`, {
        params: {
          project_id: selectedProjectId,
          date: format(selectedDate, 'yyyy-MM-dd')
        }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="column">
      <div className="column-header">
        <span className="column-title">Dashboard</span>
      </div>
      <div className="flex-row gap" style={{ justifyContent: 'space-between', flexWrap: 'nowrap' }}>
        {/* Today Card */}
        <div className="card" style={{ flex: 1 }}>
          <div className="column-title">Today</div>
          <div className="text-main text-bold dashboard-stats">{stats.dayXP} <span className="text-sub">XP</span></div>
          <div className="text-sub">Best: {bestXP} XP <span role="img" aria-label="fire">🔥</span></div>
        </div>
        {/* Tracked Time Card */}
        <div className="card" style={{ flex: 1 }}>
          <div className="column-title">Tracked time</div>
          <div className="text-main text-bold dashboard-stats">{stats.actual_duration}<span className="text-sub"> m</span></div>
          <div className="text-sub">Best: {bestTime}m <span role="img" aria-label="fire">🔥</span></div>
        </div>
        {/* Streak Card */}
        <div className="card" style={{ flex: 1 }}>
          <div className="column-title">Streak</div>
          <div className="text-main text-bold dashboard-stats"><span role="img" aria-label="fire">🔥</span> {stats.streak} <span className="text-sub">days</span></div>
          <div className="text-sub">Best: 0 days <span role="img" aria-label="fire">🔥</span></div>
        </div>
      </div>
    </div>
  );
};

export default DashboardColumn; 