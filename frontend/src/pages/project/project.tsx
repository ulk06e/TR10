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

const systemProjectIds = ['all_projects', 'other_projects'];

const ProjectColumn: React.FC<ProjectProps> = ({ onProjectSelect, selectedProjectId }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [open, setOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; projectId: string | null }>({ open: false, projectId: null });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setError(null);
      await axios.get('http://localhost:8000/projects/system');
      const response = await axios.get('http://localhost:8000/projects');
      setProjects(response.data);
    } catch (error) {
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
      setError('Failed to add project');
    }
  };

  const handleProjectClick = (projectId: string) => {
    onProjectSelect(projectId);
  };

  const handleProjectDoubleClick = (projectId: string) => {
    if (!systemProjectIds.includes(projectId)) {
      setDeleteDialog({ open: true, projectId });
    }
  };

  const handleDeleteProject = async () => {
    if (!deleteDialog.projectId) return;
    try {
      await axios.delete(`http://localhost:8000/projects/${deleteDialog.projectId}`);
      setProjects(projects.filter(p => p.id !== deleteDialog.projectId));
      setDeleteDialog({ open: false, projectId: null });
    } catch (error) {
      alert('Failed to delete project');
    }
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialog({ open: false, projectId: null });
  };

  // Level-up mechanism (description):
  // When a project's current_xp >= next_level_xp, increment current_level by 1,
  // subtract next_level_xp from current_xp, recalculate next_level_xp as 200 * new_level,
  // and repeat if still enough XP for another level up.

  // Calculate next_level_xp for display
  const getNextLevelXP = (level: number) => 200 * level;

  // Sort projects: All Projects always first, then by level desc, then xp desc
  const sortedProjects = [
    ...projects.filter(p => p.id === 'all_projects'),
    ...projects
      .filter(p => p.id !== 'all_projects')
      .sort((a, b) => b.current_level - a.current_level || b.current_xp - a.current_xp)
  ];

  return (
    <div className="column">
      <div className="column-header">
        <span className="column-title">Projects</span>
        <button
          className="column-add-btn"
          onClick={() => setOpen(true)}
          aria-label="Add new project"
        >
          Add Project
        </button>
      </div>
      <div className="item-list gap">
        {isLoading ? (
          <div className="text-main">Loading projects...</div>
        ) : error ? (
          <div className="text-main text-sub">{error}</div>
        ) : (
          sortedProjects.map((project) => {
            const nextLevelXP = getNextLevelXP(project.current_level);
            const progress = Math.min(1, project.current_xp / nextLevelXP);
            return (
              <div
                key={project.id}
                className={`item card ${project.id === selectedProjectId ? 'selected' : ''} ${systemProjectIds.includes(project.id) ? 'system' : ''} project-item`}
                onClick={() => handleProjectClick(project.id)}
                onDoubleClick={() => handleProjectDoubleClick(project.id)}
                tabIndex={0}
              >
                <div className="project-item-header">
                  <span className="text-bold">{project.name}</span>
                  <span className="text-sub">Level {project.current_level}</span>
                </div>
                <div className="project-progress-container">
                  <div className="project-progress-bar" style={{ width: `${progress * 100}%` }} />
                </div>
                <div className="project-xp">
                  <span className="text-sub">{project.current_xp} / {nextLevelXP} XP</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Project Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Add New Project</DialogTitle>
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
          <Button onClick={() => setOpen(false)} className="btn">Cancel</Button>
          <Button onClick={handleAddProject} className="btn btn-primary" disabled={!newProjectName.trim()}>
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Project Dialog */}
      <Dialog open={deleteDialog.open} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Delete Project</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this project?
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} className="btn">Cancel</Button>
          <Button onClick={handleDeleteProject} className="btn btn-danger">Delete</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default ProjectColumn; 