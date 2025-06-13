import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Select, MenuItem, FormControl, InputLabel, Popover, styled } from '@mui/material';
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

const TaskCard = styled('div')(({ theme }) => ({
  border: '1px solid #e5e5e5',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  cursor: 'pointer',
  transition: 'box-shadow 0.2s ease-in-out',
  '&:hover': {
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)',
  }
}));

const ActionButton = styled(Button)(({ theme }) => ({
  background: '#f7f6f3',
  color: '#2c2c2c',
  borderRadius: '6px',
  fontWeight: 500,
  fontSize: '0.9rem',
  boxShadow: 'none',
  padding: '0.5rem 1rem',
  textTransform: 'none',
  border: 'none',
  '&:hover': {
    background: '#f0efeb',
  }
}));

const DeleteButton = styled(ActionButton)({
  color: '#e03e3e',
  '&:hover': {
    background: '#f0efeb',
  }
});

const StartButton = styled(ActionButton)({
  background: '#2c2c2c',
  color: '#fff',
  '&:hover': {
    background: '#1a1a1a',
  }
});

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
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);

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
      setError(null);
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to clean DB';
      setError(errorMessage);
      alert(`Failed to clean DB: ${errorMessage}`);
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
      setError(null);
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to delete task';
      setError(errorMessage);
      alert(`Failed to delete task: ${errorMessage}`);
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
      setError(null);
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to update task';
      setError(errorMessage);
      alert(`Failed to update task: ${errorMessage}`);
    }
  };

  const handleStartTimer = () => {
    console.log('Start timer clicked');
    if (!selectedTask) {
      console.log('No selected task');
      return;
    }
    
    console.log('Starting timer for task:', selectedTask);
    setTimerSeconds(selectedTask.estimated_minutes * 60);
    setIsTimerNegative(false);
    setIsTimerPaused(false);
    setTimerOpen(true);
    setActiveTaskId(selectedTask.id);
    setElapsedTime(0);
    setStartTime(new Date());
    handleTaskPopupClose();

    const interval = setInterval(() => {
      setTimerSeconds(prev => {
        if (prev <= 0) {
          setIsTimerNegative(true);
          return prev - 1;
        }
        return prev - 1;
      });
      setElapsedTime(prev => prev + 1);
    }, 1000);

    console.log('Setting timer interval');
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
        setElapsedTime(prev => prev + 1);
      }, 1000);
      setTimerInterval(interval);
      setIsTimerPaused(false);
    }
  };

  const handleFinishTimer = async () => {
    console.log('Finish timer clicked');
    console.log('Active task ID:', activeTaskId);
    console.log('Timer interval:', timerInterval);
    
    if (!activeTaskId) {
      console.log('No active task ID');
      return;
    }

    // Find the task in the items array
    const taskToComplete = items.find(item => item.id === activeTaskId);
    if (!taskToComplete) {
      console.log('Task not found in items array');
      return;
    }
    
    if (timerInterval) {
      console.log('Clearing interval');
      clearInterval(timerInterval);
    }
    
    // Use elapsed time instead of timer seconds for actual duration
    const actualDuration = Math.ceil(elapsedTime / 60); // Convert seconds to minutes and round up
    const timeQuality = isTimerPaused ? 'not-pure' : 'pure';
    
    console.log('Timer data:', {
      actualDuration,
      timeQuality,
      elapsedTime,
      isTimerPaused
    });
    
    try {
      console.log('Sending request to update task');
      const response = await axios.put(`http://localhost:8000/items/${activeTaskId}`, {
        completed: true,
        actual_duration: actualDuration,
        time_quality: timeQuality,
        completed_time: new Date().toISOString(),
        column_origin: 'fact'
      });
      
      console.log('Server response:', response.data);

      // Show task data in alert
      const taskData = {
        description: taskToComplete.description,
        estimated_time: taskToComplete.estimated_minutes,
        actual_time: actualDuration,
        time_quality: timeQuality,
        completed_at: new Date().toISOString(),
        time_difference: actualDuration - taskToComplete.estimated_minutes
      };
      
      console.log('Task data:', taskData);
      alert(JSON.stringify(taskData, null, 2));
      
      console.log('Updating items state');
      setItems(prevItems => {
        // First, remove the task from the plan column
        const itemsWithoutCompletedTask = prevItems.filter(item => item.id !== activeTaskId);
        
        // Then, add the completed task (with updated data from server) to the fact column
        // The response.data contains the updated task with column_origin set to 'fact'
        const updatedItems = [response.data, ...itemsWithoutCompletedTask];
        
        return updatedItems;
      });
      
      console.log('Cleaning up timer states');
      // Cleanup timer states
      setTimerOpen(false);
      setTimerSeconds(0);
      setIsTimerPaused(false);
      setIsTimerNegative(false);
      setTimerInterval(null);
      setActiveTaskId(null);
      
      console.log('Timer cleanup complete');
    } catch (error: any) {
      console.error('Error completing task:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to complete task';
      setError(errorMessage);
      alert(`Failed to complete task: ${errorMessage}`);
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
            <div className="text-main"></div>
          ) : error ? (
            <div className="text-main text-sub">{error}</div>
          ) : (
            sortedItems.map((item, index) => (
              <TaskCard
                key={item.id}
                className="item card"
                onClick={(e) => handleTaskClick(e, item)}
                style={{ 
                  border: index === 0 ? '2px solid #111' : '1px solid #e5e5e5',
                }}
              >
                <div className="text-main text-bold">#{item.priority} - {item.task_quality} : {item.description}</div>
                <div className="text-sub" style={{ marginTop: 8 }}>{item.estimated_minutes}m</div>
              </TaskCard>
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
            .sort((a, b) => new Date(b.completed_time!).getTime() - new Date(a.completed_time!).getTime())
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
                <div className="text-main text-bold">#{item.priority} - {item.task_quality} : {item.description}</div>
                <div className="text-sub">
                  {item.actual_duration}m / {item.estimated_minutes}m - {new Date(item.completed_time!).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  {item.time_quality === 'not-pure' && item.actual_duration && (
                    <span style={{ color: 'red', marginLeft: '8px' }}>
                      (Unaccounted time: {item.actual_duration - item.estimated_minutes}m)
                    </span>
                  )}
                  <div style={{ marginTop: '4px', color: '#4CAF50' }}>
                    +{item.xp_value} XP
                  </div>
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
        PaperProps={{
          style: {
            borderRadius: '8px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            padding: '8px',
            background: '#fff',
          }
        }}
      >
        <div style={{ display: 'flex', gap: '8px' }}>
          <DeleteButton
            startIcon={<DeleteIcon />}
            onClick={handleDeleteTask}
          >
            Delete
          </DeleteButton>
          <ActionButton
            startIcon={<EditIcon />}
            onClick={handleEditTask}
          >
            Edit
          </ActionButton>
          <StartButton
            startIcon={<PlayArrowIcon />}
            onClick={handleStartTimer}
          >
            Start
          </StartButton>
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

      {/* Timer Dialog - Notion style */}
      <Dialog open={timerOpen} onClose={() => {}} PaperProps={{
        style: {
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          minWidth: 340,
          padding: '0 0 1.5rem 0',
          background: '#fff',
        }
      }}>
        <DialogTitle style={{
          fontWeight: 600,
          fontSize: '1.2rem',
          borderBottom: '1px solid #f0f0f0',
          padding: '1.2rem 1.5rem 0.7rem 1.5rem',
          letterSpacing: 0.1,
        }}>
          Task Timer
        </DialogTitle>
        <DialogContent style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem 1.5rem 1rem 1.5rem',
        }}>
          <div style={{
            textAlign: 'center',
            fontSize: '3.2rem',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            color: isTimerNegative ? '#e03e3e' : '#2c2c2c',
            background: '#f7f6f3',
            borderRadius: '12px',
            padding: '0.9rem 2.2rem',
            marginBottom: '1.5rem',
            minWidth: '220px',
            boxShadow: isTimerNegative ? '0 0 0 2px #e03e3e' : '0 0 0 1.5px #e0e0e0',
            transition: 'box-shadow 0.2s',
            letterSpacing: '0.04em',
          }}>
            {formatTimer(timerSeconds)}
          </div>
        </DialogContent>
        <DialogActions style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '1.2rem',
          padding: '0 0 1.5rem 0',
        }}>
          {isTimerPaused ? (
            <Button
              startIcon={<PlayArrowIcon />}
              onClick={handleContinueTimer}
              style={{
                background: '#f7f6f3',
                color: '#2c2c2c',
                borderRadius: '8px',
                fontWeight: 500,
                fontSize: '1.08rem',
                boxShadow: 'none',
                padding: '0.6rem 1.4rem',
                textTransform: 'none',
                border: 'none',
              }}
            >
              Continue
            </Button>
          ) : (
            <Button
              startIcon={<PauseIcon />}
              onClick={handlePauseTimer}
              style={{
                background: '#f7f6f3',
                color: '#2c2c2c',
                borderRadius: '8px',
                fontWeight: 500,
                fontSize: '1.08rem',
                boxShadow: 'none',
                padding: '0.6rem 1.4rem',
                textTransform: 'none',
                border: 'none',
              }}
            >
              Pause
            </Button>
          )}
          <Button
            startIcon={<StopIcon />}
            onClick={handleFinishTimer}
            style={{
              background: '#2c2c2c',
              color: '#fff',
              borderRadius: '8px',
              fontWeight: 500,
              fontSize: '1.08rem',
              boxShadow: 'none',
              padding: '0.6rem 1.4rem',
              textTransform: 'none',
              border: 'none',
            }}
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
