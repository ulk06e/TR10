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
        <h2 className="column-title">Dashboard</h2>
      </div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.dayXP}</div>
          <div className="stat-label">Day XP</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {Math.floor(stats.actual_duration / 60)}h {stats.actual_duration % 60}m
          </div>
          <div className="stat-label">Time Today</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.streak}</div>
          <div className="stat-label">Day Streak</div>
        </div>
      </div>
    </div>
  );
};

export default DashboardColumn; 