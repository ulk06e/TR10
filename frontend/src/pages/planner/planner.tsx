import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Select, MenuItem, FormControl, InputLabel, Popover } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import StopIcon from '@mui/icons-material/Stop';
import axios from 'axios';

interface Item {
  id: string;
  description: string;
  time_type: 'to-goal' | 'to-time';
  task_quality: 'A' | 'B' | 'C' | 'D';
  estimated_minutes: number;
  priority: number;
  completed: boolean;
  column_origin: 'plan' | 'fact';
  xp_value: number;
  created_time: string;
  completed_time: string | null;
  actual_duration: number | null;
  time_quality: 'pure' | 'not-pure';
  project_id: string;
  day_id: string;
}

interface PlannerProps {
  selectedProjectId: string;
  selectedDate: Date;
}

const Planner: React.FC<PlannerProps> = ({ selectedProjectId, selectedDate }) => {
  const [items, setItems] = useState<Item[]>([]);
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState(5);
  const [taskQuality, setTaskQuality] = useState<'A' | 'B' | 'C' | 'D'>('C');
  const [timeType, setTimeType] = useState<'to-goal' | 'to-time'>('to-goal');
  const [estimatedMinutes, setEstimatedMinutes] = useState(60);
  const [timeQuality, setTimeQuality] = useState<'pure' | 'not-pure'>('pure');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // New states for task management
  const [selectedTask, setSelectedTask] = useState<Item | null>(null);
  const [taskPopupAnchor, setTaskPopupAnchor] = useState<HTMLElement | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [timerOpen, setTimerOpen] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerPaused, setIsTimerPaused] = useState(false);
  const [isTimerNegative, setIsTimerNegative] = useState(false);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);
  const [lastTaskEndTime, setLastTaskEndTime] = useState<Date | null>(null);

  useEffect(() => {
    fetchItems();
  }, [selectedProjectId, selectedDate]);

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      setError(null);
      const dayId = selectedDate.toISOString().split('T')[0];
      const response = await axios.get('http://localhost:8000/items', {
        params: { project_id: selectedProjectId === 'all_projects' ? '' : selectedProjectId, day_id: dayId }
      });
      setItems(response.data);
    } catch (error) {
      setError('Failed to fetch tasks');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddItem = async () => {
    if (!description.trim()) {
      setError('Task name cannot be empty');
      return;
    }
    try {
      setError(null);
      const dayId = selectedDate.toISOString().split('T')[0];
      const response = await axios.post('http://localhost:8000/items', {
        description: description.trim(),
        time_type: timeType,
        task_quality: taskQuality,
        estimated_minutes: estimatedMinutes,
        priority,
        completed: false,
        column_origin: 'plan',
        xp_value: 0,
        time_quality: timeQuality,
        project_id: selectedProjectId,
        day_id: dayId
      });
      setItems(prev => [...prev, response.data]);
      setOpen(false);
      setDescription('');
    } catch (error) {
      setError('Failed to add task');
    }
  };

  const handleClose = () => {
    setOpen(false);
    setDescription('');
    setError(null);
  };

  const handleCleanDB = async () => {
    try {
      await axios.delete('http://localhost:8000/clean');
      setItems([]);
    } catch (error) {
      alert('Failed to clean DB');
    }
  };

  // Sort items by priority and task quality
  const sortedItems = items.sort((a, b) => {
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }
    return a.task_quality.localeCompare(b.task_quality);
  });

  const handleTaskClick = (event: React.MouseEvent<HTMLElement>, task: Item) => {
    setSelectedTask(task);
    setTaskPopupAnchor(event.currentTarget);
  };

  const handleTaskPopupClose = () => {
    setTaskPopupAnchor(null);
    setSelectedTask(null);
  };

  const handleDeleteTask = async () => {
    if (!selectedTask) return;
    try {
      await axios.delete(`http://localhost:8000/items/${selectedTask.id}`);
      setItems(items.filter(item => item.id !== selectedTask.id));
      handleTaskPopupClose();
    } catch (error) {
      setError('Failed to delete task');
    }
  };

  const handleEditTask = () => {
    if (!selectedTask) return;
    setDescription(selectedTask.description);
    setPriority(selectedTask.priority);
    setTaskQuality(selectedTask.task_quality);
    setTimeType(selectedTask.time_type);
    setEstimatedMinutes(selectedTask.estimated_minutes);
    setEditDialogOpen(true);
    handleTaskPopupClose();
  };

  const handleEditSubmit = async () => {
    if (!selectedTask) return;
    try {
      const response = await axios.put(`http://localhost:8000/items/${selectedTask.id}`, {
        description,
        priority,
        task_quality: taskQuality,
        time_type: timeType,
        estimated_minutes: estimatedMinutes
      });
      setItems(items.map(item => item.id === selectedTask.id ? response.data : item));
      setEditDialogOpen(false);
    } catch (error) {
      setError('Failed to update task');
    }
  };

  const handleStartTimer = () => {
    if (!selectedTask) return;
    setTimerSeconds(selectedTask.estimated_minutes * 60);
    setIsTimerNegative(false);
    setIsTimerPaused(false);
    setTimerOpen(true);
    handleTaskPopupClose();

    const interval = setInterval(() => {
      setTimerSeconds(prev => {
        if (prev <= 0) {
          setIsTimerNegative(true);
          return prev - 1;
        }
        return prev - 1;
      });
    }, 1000);

    setTimerInterval(interval);
  };

  const handlePauseTimer = () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      setIsTimerPaused(true);
    }
  };

  const handleContinueTimer = () => {
    if (isTimerPaused) {
      const interval = setInterval(() => {
        setTimerSeconds(prev => {
          if (prev <= 0) {
            setIsTimerNegative(true);
            return prev - 1;
          }
          return prev - 1;
        });
      }, 1000);
      setTimerInterval(interval);
      setIsTimerPaused(false);
    }
  };

  const handleFinishTimer = async () => {
    if (!selectedTask || !timerInterval) return;
    clearInterval(timerInterval);
    
    const actualDuration = Math.abs(timerSeconds);
    const timeQuality = isTimerPaused ? 'not-pure' : 'pure';
    
    try {
      const response = await axios.put(`http://localhost:8000/items/${selectedTask.id}`, {
        completed: true,
        actual_duration: actualDuration,
        time_quality,
        completed_time: new Date().toISOString(),
        column_origin: 'fact'
      });

      setItems(prevItems => prevItems.map(item => 
        item.id === selectedTask.id ? response.data : item
      ));

      setTimerOpen(false);
      setTimerSeconds(0);
      setIsTimerPaused(false);
      setIsTimerNegative(false);
      setTimerInterval(null);
      setSelectedTask(null);
    } catch (error) {
      setError('Failed to complete task');
    }
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, [timerInterval]);

  // Format timer display
  const formatTimer = (seconds: number) => {
    const absSeconds = Math.abs(seconds);
    const hours = Math.floor(absSeconds / 3600);
    const minutes = Math.floor((absSeconds % 3600) / 60);
    const remainingSeconds = absSeconds % 60;
    const sign = seconds < 0 ? '-' : '';
    return `${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex-row gap" style={{ width: '100%' }}>
      {/* Plan Column */}
      <div className="column" style={{ flex: 1 }}>
        <div className="column-header">
          <span className="column-title">Plan</span>
          <button
            className="column-add-btn"
            onClick={() => setOpen(true)}
            aria-label="Add new task"
          >
            Add Item
          </button>
        </div>
        <div className="item-list gap">
          {isLoading ? (
            <div className="text-main">Loading tasks...</div>
          ) : error ? (
            <div className="text-main text-sub">{error}</div>
          ) : (
            sortedItems.map((item, index) => (
              <div
                key={item.id}
                className="item card"
                onClick={(e) => handleTaskClick(e, item)}
                style={{ 
                  border: index === 0 ? '2px solid #111' : '1px solid #e5e5e5',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                  cursor: 'pointer'
                }}
              >
                <div className="text-main text-bold">#{item.priority} - {item.task_quality} : {item.description}</div>
                <div className="text-sub" style={{ marginTop: 8 }}>{item.estimated_minutes}m</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Fact Column */}
      <div className="column" style={{ flex: 1 }}>
        <div className="column-header">
          <span className="column-title">Fact</span>
        </div>
        <div className="item-list gap">
          {items
            .filter(item => item.column_origin === 'fact')
            .map((item, index) => (
              <div
                key={item.id}
                className="item card"
                style={{ 
                  border: '1px solid #e5e5e5',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                  backgroundColor: item.time_quality === 'pure' ? '#e8f5e9' : 'white'
                }}
              >
                <div className="text-main text-bold">{item.description}</div>
                <div className="text-sub">
                  {item.actual_duration}m / {item.estimated_minutes}m - {new Date(item.completed_time!).toLocaleTimeString()}
                  {item.time_quality === 'not-pure' && (
                    <span style={{ color: 'red', marginLeft: '8px' }}>
                      (Unaccounted time: {item.actual_duration - item.estimated_minutes}m)
                    </span>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Task Popup */}
      <Popover
        open={Boolean(taskPopupAnchor)}
        anchorEl={taskPopupAnchor}
        onClose={handleTaskPopupClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        <div style={{ padding: '8px', display: 'flex', gap: '8px' }}>
          <Button
            startIcon={<DeleteIcon />}
            onClick={handleDeleteTask}
            className="btn btn-danger"
          >
            Delete
          </Button>
          <Button
            startIcon={<EditIcon />}
            onClick={handleEditTask}
            className="btn"
          >
            Edit
          </Button>
          <Button
            startIcon={<PlayArrowIcon />}
            onClick={handleStartTimer}
            className="btn btn-primary"
          >
            Start
          </Button>
        </div>
      </Popover>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <DialogTitle>Edit Task</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Task Name"
            type="text"
            fullWidth
            variant="outlined"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            error={!!error}
            helperText={error}
          />
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <FormControl fullWidth margin="dense">
              <InputLabel>Priority</InputLabel>
              <Select value={priority} onChange={(e) => setPriority(Number(e.target.value))}>
                {[...Array(10)].map((_, i) => (
                  <MenuItem key={i+1} value={i+1}>{i+1}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth margin="dense">
              <InputLabel>Time Type</InputLabel>
              <Select value={timeType} onChange={(e) => setTimeType(e.target.value as 'to-goal' | 'to-time')}>
                <MenuItem value="to-goal">to-goal</MenuItem>
                <MenuItem value="to-time">to-time</MenuItem>
              </Select>
            </FormControl>
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <FormControl fullWidth margin="dense">
              <InputLabel>Quality</InputLabel>
              <Select value={taskQuality} onChange={(e) => setTaskQuality(e.target.value as 'A' | 'B' | 'C' | 'D')}>
                <MenuItem value="A">A</MenuItem>
                <MenuItem value="B">B</MenuItem>
                <MenuItem value="C">C</MenuItem>
                <MenuItem value="D">D</MenuItem>
              </Select>
            </FormControl>
            <TextField
              margin="dense"
              label="Estimated Duration (minutes)"
              type="number"
              fullWidth
              variant="outlined"
              value={estimatedMinutes}
              onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)} className="btn">Cancel</Button>
          <Button onClick={handleEditSubmit} className="btn btn-primary">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Timer Dialog */}
      <Dialog open={timerOpen} onClose={() => {}}>
        <DialogTitle>Task Timer</DialogTitle>
        <DialogContent>
          <div style={{ 
            textAlign: 'center', 
            fontSize: '2rem', 
            fontFamily: 'monospace',
            color: isTimerNegative ? 'red' : 'inherit',
            margin: '1rem 0'
          }}>
            {formatTimer(timerSeconds)}
          </div>
        </DialogContent>
        <DialogActions>
          {isTimerPaused ? (
            <Button
              startIcon={<PlayArrowIcon />}
              onClick={handleContinueTimer}
              className="btn btn-primary"
            >
              Continue
            </Button>
          ) : (
            <Button
              startIcon={<PauseIcon />}
              onClick={handlePauseTimer}
              className="btn"
            >
              Pause
            </Button>
          )}
          <Button
            startIcon={<StopIcon />}
            onClick={handleFinishTimer}
            className="btn btn-primary"
          >
            Finish
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Task Dialog */}
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Add New Task</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Task Name"
            type="text"
            fullWidth
            variant="outlined"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            error={!!error}
            helperText={error}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleAddItem();
              }
            }}
          />
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <FormControl fullWidth margin="dense">
              <InputLabel>Priority</InputLabel>
              <Select value={priority} onChange={(e) => setPriority(Number(e.target.value))}>
                {[...Array(10)].map((_, i) => (
                  <MenuItem key={i+1} value={i+1}>{i+1}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth margin="dense">
              <InputLabel>Time Type</InputLabel>
              <Select value={timeType} onChange={(e) => setTimeType(e.target.value as 'to-goal' | 'to-time')}>
                <MenuItem value="to-goal">to-goal</MenuItem>
                <MenuItem value="to-time">to-time</MenuItem>
              </Select>
            </FormControl>
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <FormControl fullWidth margin="dense">
              <InputLabel>Quality</InputLabel>
              <Select value={taskQuality} onChange={(e) => setTaskQuality(e.target.value as 'A' | 'B' | 'C' | 'D')}>
                <MenuItem value="A">A</MenuItem>
                <MenuItem value="B">B</MenuItem>
                <MenuItem value="C">C</MenuItem>
                <MenuItem value="D">D</MenuItem>
              </Select>
            </FormControl>
            <TextField
              margin="dense"
              label="Estimated Duration (minutes)"
              type="number"
              fullWidth
              variant="outlined"
              value={estimatedMinutes}
              onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} className="btn">Cancel</Button>
          <Button 
            onClick={handleAddItem} 
            className="btn btn-primary"
            disabled={!description.trim()}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Planner;
