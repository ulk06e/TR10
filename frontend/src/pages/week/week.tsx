import React from 'react';
import { Button } from '@mui/material';
import { format, startOfWeek, addDays, isSameDay, isToday } from 'date-fns';
import TodayIcon from '@mui/icons-material/Today';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

interface WeekColumnProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

const WeekColumn: React.FC<WeekColumnProps> = ({ selectedDate, onDateSelect }) => {
  const startOfCurrentWeek = startOfWeek(selectedDate, { weekStartsOn: 1 });
  
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(startOfCurrentWeek, i);
    return {
      date,
      isSelected: isSameDay(date, selectedDate),
      isToday: isToday(date)
    };
  });

  const goToToday = () => {
    onDateSelect(new Date());
  };

  return (
    <div className="column">
      <div className="column-header">
        <h2 className="column-title">Week</h2>
        <Button
          variant="contained"
          startIcon={<TodayIcon />}
          onClick={goToToday}
        >
          Today
        </Button>
      </div>
      <div className="week-navigation">
        <Button startIcon={<ArrowBackIcon />}>Previous</Button>
        <span>{format(startOfCurrentWeek, 'MMM d')} - {format(addDays(startOfCurrentWeek, 6), 'MMM d')}</span>
        <Button endIcon={<ArrowForwardIcon />}>Next</Button>
      </div>
      <div className="week-days">
        {weekDays.map(({ date, isSelected, isToday }) => (
          <Button
            key={date.toISOString()}
            variant={isSelected ? "contained" : "outlined"}
            onClick={() => onDateSelect(date)}
            className={`week-day-button ${isToday ? 'today' : ''}`}
          >
            <div className="week-day-content">
              <div className="week-day-name">{format(date, 'EEE')}</div>
              <div className="week-day-date">{format(date, 'd')}</div>
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
};

export default WeekColumn; 