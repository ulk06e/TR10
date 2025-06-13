import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import axios from 'axios';

interface PlannerItem {
  id: number;
  plan_name: string;
  fact_name: string | null;
}

interface PlannerProps {
  selectedProjectId: string;
  selectedDate: Date;
}

const Planner: React.FC<PlannerProps> = ({ selectedProjectId, selectedDate }) => {
  const [planners, setPlanners] = useState<PlannerItem[]>([]);
  const [open, setOpen] = useState(false);
  const [newPlanName, setNewPlanName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPlanners();
  }, [selectedProjectId, selectedDate]);

  const fetchPlanners = async () => {
    try {
      setError(null);
      const response = await axios.get('http://localhost:8000/planners');
      setPlanners(response.data);
    } catch (error) {
      console.error('Error fetching planners:', error);
      setError('Failed to fetch tasks');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPlan = async () => {
    if (!newPlanName.trim()) {
      setError('Task name cannot be empty');
      return;
    }

    try {
      setError(null);
      const response = await axios.post('http://localhost:8000/planners', {
        plan_name: newPlanName.trim(),
        fact_name: null
      });
      setPlanners(prevPlanners => [...prevPlanners, response.data]);
      setOpen(false);
      setNewPlanName('');
    } catch (error) {
      console.error('Error adding task:', error);
      setError('Failed to add task');
    }
  };

  const handleClose = () => {
    setOpen(false);
    setNewPlanName('');
    setError(null);
  };

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
              Add
            </Button>
          </div>
          <div className="item-list">
            {isLoading ? (
              <div>Loading tasks...</div>
            ) : error ? (
              <div className="error-message">{error}</div>
            ) : (
              planners.map((planner) => (
                <div
                  key={planner.id}
                  className="item"
                  role="listitem"
                >
                  {planner.plan_name}
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
            {planners.map((planner) => (
              planner.fact_name && (
                <div
                  key={planner.id}
                  className="item"
                  role="listitem"
                >
                  {planner.fact_name}
                </div>
              )
            ))}
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
            value={newPlanName}
            onChange={(e) => setNewPlanName(e.target.value)}
            error={!!error}
            helperText={error}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleAddPlan();
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button 
            onClick={handleAddPlan} 
            variant="contained" 
            color="primary"
            disabled={!newPlanName.trim()}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Planner;
