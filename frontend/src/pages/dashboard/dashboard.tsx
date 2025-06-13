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
    <div className="column" style={{ background: '#fff', color: '#111', border: '1px solid #ccc', minWidth: 350, marginLeft: 32 }}>
      <div className="column-header" style={{ borderBottom: '1px solid #e5e5e5', marginBottom: 16 }}>
        <h2 className="column-title" style={{ color: '#111', fontWeight: 700 }}>Dashboard</h2>
      </div>
      <div style={{ display: 'flex', gap: 24, justifyContent: 'space-between', flexWrap: 'wrap' }}>
        {/* Today Card */}
        <div style={{ flex: 1, minWidth: 220, background: '#fff', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', padding: 24, marginBottom: 16, border: '1px solid #eee', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ color: '#222', fontWeight: 500, fontSize: 18, marginBottom: 8 }}>Today</div>
          <div style={{ color: '#111', fontWeight: 700, fontSize: 32, marginBottom: 4 }}>{stats.dayXP} <span style={{ fontSize: 20, fontWeight: 500 }}>XP</span></div>
          <div style={{ color: '#888', fontWeight: 400, fontSize: 15 }}>Best: {bestXP} XP <span role="img" aria-label="fire">🔥</span></div>
        </div>
        {/* Tracked Time Card */}
        <div style={{ flex: 1, minWidth: 220, background: '#fff', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', padding: 24, marginBottom: 16, border: '1px solid #eee', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ color: '#222', fontWeight: 500, fontSize: 18, marginBottom: 8 }}>Tracked time</div>
          <div style={{ color: '#111', fontWeight: 700, fontSize: 32, marginBottom: 4 }}>{stats.actual_duration}m</div>
          <div style={{ color: '#888', fontWeight: 400, fontSize: 15 }}>Best: {bestTime}m <span role="img" aria-label="fire">🔥</span></div>
        </div>
        {/* Streak Card */}
        <div style={{ flex: 1, minWidth: 220, background: '#fff', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', padding: 24, marginBottom: 16, border: '1px solid #eee', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ color: '#222', fontWeight: 500, fontSize: 18, marginBottom: 8 }}>Streak</div>
          <div style={{ color: '#111', fontWeight: 700, fontSize: 32, marginBottom: 4 }}><span role="img" aria-label="fire">🔥</span> {stats.streak} days</div>
          <div style={{ color: '#888', fontWeight: 400, fontSize: 15 }}>Best: 0 days <span role="img" aria-label="fire">🔥</span></div>
        </div>
      </div>
    </div>
  );
};

export default DashboardColumn; 