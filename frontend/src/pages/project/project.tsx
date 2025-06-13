import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import axios from 'axios';

interface Project {
  id: string;
  name: string;
  current_xp: number;
  current_level: number;
  next_level_xp: number;
  actual_duration_sum: number;
  exists: boolean;
}

interface ProjectProps {
  onProjectSelect: (projectId: string) => void;
  selectedProjectId: string;
}

const ProjectColumn: React.FC<ProjectProps> = ({ onProjectSelect, selectedProjectId }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [open, setOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setError(null);
      // First, ensure system projects exist
      await axios.get('http://localhost:8000/projects/system');
      
      // Then fetch all projects
      const response = await axios.get('http://localhost:8000/projects');
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setError('Failed to fetch projects');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddProject = async () => {
    if (!newProjectName.trim()) {
      setError('Project name cannot be empty');
      return;
    }

    try {
      setError(null);
      const response = await axios.post('http://localhost:8000/projects', {
        name: newProjectName.trim()
      });
      
      setProjects(prevProjects => [...prevProjects, response.data]);
      setOpen(false);
      setNewProjectName('');
    } catch (error) {
      console.error('Error adding project:', error);
      setError('Failed to add project');
    }
  };

  const handleProjectClick = (projectId: string) => {
    onProjectSelect(projectId);
  };

  const handleClose = () => {
    setOpen(false);
    setNewProjectName('');
    setError(null);
  };

  return (
    <div className="column">
      <div className="column-header">
        <h2 className="column-title">Projects</h2>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpen(true)}
          aria-label="Add new project"
        >
          Add
        </Button>
      </div>
      <div className="item-list">
        {isLoading ? (
          <div>Loading projects...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : (
          projects.map((project) => (
            <div
              key={project.id}
              className={`item ${project.id === selectedProjectId ? 'selected' : ''}`}
              onClick={() => handleProjectClick(project.id)}
              style={{ cursor: 'pointer' }}
              role="button"
              tabIndex={0}
              onKeyPress={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleProjectClick(project.id);
                }
              }}
            >
              <div className="project-name">{project.name}</div>
              {project.id !== 'all_projects' && (
                <div className="project-stats">
                  <div>Level: {project.current_level}</div>
                  <div>XP: {project.current_xp}/{project.next_level_xp}</div>
                  <div>Total Time: {Math.round(project.actual_duration_sum / 60)}h {project.actual_duration_sum % 60}m</div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <Dialog 
        open={open} 
        onClose={handleClose}
        aria-labelledby="add-project-dialog-title"
      >
        <DialogTitle id="add-project-dialog-title">Add New Project</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Project Name"
            type="text"
            fullWidth
            variant="outlined"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            error={!!error}
            helperText={error}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleAddProject();
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button 
            onClick={handleAddProject} 
            variant="contained" 
            color="primary"
            disabled={!newProjectName.trim()}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default ProjectColumn; 