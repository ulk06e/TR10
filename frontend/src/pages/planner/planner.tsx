import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
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

  useEffect(() => {
    fetchItems();
  }, [selectedProjectId, selectedDate]);

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      setError(null);
      const dayId = selectedDate.toISOString().split('T')[0];
      let projectId = selectedProjectId;
      if (projectId === 'all_projects') {
        // Fetch all items for the day
        const response = await axios.get('http://localhost:8000/items', {
          params: { project_id: '', day_id: dayId }
        });
        setItems(response.data);
      } else {
        const response = await axios.get('http://localhost:8000/items', {
          params: { project_id: projectId, day_id: dayId }
        });
        setItems(response.data);
      }
    } catch (error) {
      console.error('Error fetching items:', error);
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
      console.error('Error adding task:', error);
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

  // Filter items for plan column
  const planItems = items.filter(item => item.column_origin === 'plan');

  return (
    <div className="planner-container">
      <div className="columns-container">
        {/* Plan Column */}
        <div className="column">
          <div className="column-header">
            <h2 className="column-title">Plan</h2>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpen(true)}
              aria-label="Add new task"
            >
              Add Item
            </Button>
          </div>
          <div className="item-list">
            {isLoading ? (
              <div>Loading tasks...</div>
            ) : error ? (
              <div className="error-message">{error}</div>
            ) : (
              planItems.map((item) => (
                <div
                  key={item.id}
                  className="item"
                  style={{ border: '2px solid #222', borderRadius: '12px', padding: '16px', marginBottom: '12px', fontSize: '1.1em' }}
                >
                  <div><b>#{item.priority}</b> - {item.task_quality} : {item.description}</div>
                  <div style={{ marginTop: '8px', color: '#666' }}>{item.estimated_minutes}m</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Fact Column */}
        <div className="column">
          <div className="column-header">
            <h2 className="column-title">Fact</h2>
          </div>
          <div className="item-list">
            {/* Fact items can be shown here if needed */}
          </div>
        </div>
      </div>

      <Dialog 
        open={open} 
        onClose={handleClose}
        aria-labelledby="add-task-dialog-title"
      >
        <DialogTitle id="add-task-dialog-title">Add New Task</DialogTitle>
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
          <FormControl fullWidth margin="dense">
            <InputLabel>Priority</InputLabel>
            <Select value={priority} onChange={(e) => setPriority(Number(e.target.value))}>
              {[...Array(10)].map((_, i) => (
                <MenuItem key={i+1} value={i+1}>{i+1}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="dense">
            <InputLabel>Quality</InputLabel>
            <Select value={taskQuality} onChange={(e) => setTaskQuality(e.target.value as 'A' | 'B' | 'C' | 'D')}>
              <MenuItem value="A">A</MenuItem>
              <MenuItem value="B">B</MenuItem>
              <MenuItem value="C">C</MenuItem>
              <MenuItem value="D">D</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth margin="dense">
            <InputLabel>Time Type</InputLabel>
            <Select value={timeType} onChange={(e) => setTimeType(e.target.value as 'to-goal' | 'to-time')}>
              <MenuItem value="to-goal">to-goal</MenuItem>
              <MenuItem value="to-time">to-time</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth margin="dense">
            <InputLabel>Time Quality</InputLabel>
            <Select value={timeQuality} onChange={(e) => setTimeQuality(e.target.value as 'pure' | 'not-pure')}>
              <MenuItem value="pure">pure</MenuItem>
              <MenuItem value="not-pure">not-pure</MenuItem>
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
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button 
            onClick={handleAddItem} 
            variant="contained" 
            color="primary"
            disabled={!description.trim()}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Clean DB Button */}
      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <Button variant="outlined" color="error" onClick={handleCleanDB}>
          Clean DB
        </Button>
      </div>
    </div>
  );
};

export default Planner;
