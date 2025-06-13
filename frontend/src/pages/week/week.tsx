import React, { useEffect, useState } from 'react';
import { Button } from '@mui/material';
import { format, startOfWeek, addDays, isSameDay, isToday, isAfter } from 'date-fns';
import TodayIcon from '@mui/icons-material/Today';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import axios from 'axios';

interface WeekColumnProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  selectedProjectId: string;
}

const WeekColumn: React.FC<WeekColumnProps> = ({ selectedDate, onDateSelect, selectedProjectId }) => {
  const [plannedMinutes, setPlannedMinutes] = useState<{ [date: string]: number }>({});
  const [weekStart, setWeekStart] = useState(startOfWeek(selectedDate, { weekStartsOn: 0 }));

  useEffect(() => {
    fetchPlannedMinutes();
  }, [selectedProjectId, weekStart]);

  const fetchPlannedMinutes = async () => {
    const newPlanned: { [date: string]: number } = {};
    for (let i = 0; i < 7; i++) {
      const day = addDays(weekStart, i);
      const dayId = format(day, 'yyyy-MM-dd');
      try {
        const response = await axios.get('http://localhost:8000/items', {
          params: {
            project_id: selectedProjectId === 'all_projects' ? '' : selectedProjectId,
            day_id: dayId
          }
        });
        const sum = response.data.reduce((acc: number, item: any) => acc + (item.estimated_minutes || 0), 0);
        newPlanned[dayId] = sum;
      } catch {
        newPlanned[dayId] = 0;
      }
    }
    setPlannedMinutes(newPlanned);
  };

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    return {
      date,
      isSelected: isSameDay(date, selectedDate),
      isToday: isToday(date),
      isFuture: isAfter(date, new Date())
    };
  });

  const goToToday = () => {
    onDateSelect(new Date());
    setWeekStart(startOfWeek(new Date(), { weekStartsOn: 0 }));
  };

  const goToPrevWeek = () => {
    setWeekStart(addDays(weekStart, -7));
  };

  const goToNextWeek = () => {
    setWeekStart(addDays(weekStart, 7));
  };

  return (
    <div className="column" style={{ background: '#fff', color: '#111', border: '1px solid #ccc', minWidth: 350, margin: '32px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Button onClick={goToPrevWeek} style={{ minWidth: 32, color: '#111' }}><ArrowBackIcon /></Button>
          <span style={{ fontWeight: 600, fontSize: 22 }}>{format(weekStart, 'LLLL')}</span>
          <Button onClick={goToNextWeek} style={{ minWidth: 32, color: '#111' }}><ArrowForwardIcon /></Button>
        </div>
        <Button
          variant="contained"
          startIcon={<TodayIcon />}
          onClick={goToToday}
          style={{ background: '#222', color: '#fff', borderRadius: 8, fontWeight: 500 }}
        >
          Today
        </Button>
      </div>
      <div style={{ display: 'flex', gap: 16, justifyContent: 'space-between', marginBottom: 8 }}>
        {weekDays.map(({ date, isSelected, isToday, isFuture }) => (
          <div
            key={date.toISOString()}
            onClick={() => !isFuture && onDateSelect(date)}
            style={{
              flex: 1,
              minWidth: 120,
              background: isSelected ? '#111' : isFuture ? '#fbeaea' : '#fafafa',
              color: isSelected ? '#fff' : '#111',
              borderRadius: 12,
              border: isSelected ? '2px solid #111' : '1.5px solid #e5e5e5',
              boxShadow: isSelected ? '0 0 0 2px #b3b3b3' : 'none',
              padding: '16px 8px',
              textAlign: 'center',
              cursor: isFuture ? 'not-allowed' : 'pointer',
              opacity: isFuture ? 0.7 : 1,
              transition: 'all 0.2s',
              marginBottom: 0
            }}
          >
            <div style={{ fontWeight: 600, fontSize: 17 }}>{format(date, 'EEEE')}</div>
            <div style={{ color: isSelected ? '#fff' : '#888', fontWeight: 400, fontSize: 15 }}>{format(date, 'MMM d')}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 16, justifyContent: 'space-between', marginTop: 8 }}>
        {weekDays.map(({ date }) => (
          <div
            key={date.toISOString() + '-planned'}
            style={{ flex: 1, minWidth: 120, textAlign: 'center', color: '#888', fontStyle: 'italic', fontSize: 15 }}
          >
            {plannedMinutes[format(date, 'yyyy-MM-dd')] || 0}m planned
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeekColumn; 