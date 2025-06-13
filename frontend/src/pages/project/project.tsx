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
    <div className="column" style={{ background: '#fff', color: '#111', border: '1px solid #ccc', marginRight: '32px', minWidth: 350 }}>
      <div className="column-header" style={{ borderBottom: '1px solid #e5e5e5', marginBottom: 16 }}>
        <h2 className="column-title" style={{ color: '#111', fontWeight: 700 }}>Projects</h2>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpen(true)}
          aria-label="Add new project"
          style={{ background: '#222', color: '#fff', borderRadius: 8, fontWeight: 500 }}
        >
          Add Project
        </Button>
      </div>
      <div className="item-list" style={{ gap: 20 }}>
        {isLoading ? (
          <div>Loading projects...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : (
          sortedProjects.map((project) => {
            const nextLevelXP = getNextLevelXP(project.current_level);
            const progress = Math.min(1, project.current_xp / nextLevelXP);
            return (
              <div
                key={project.id}
                className={`item ${project.id === selectedProjectId ? 'selected' : ''}`}
                onClick={() => handleProjectClick(project.id)}
                onDoubleClick={() => handleProjectDoubleClick(project.id)}
                style={{
                  background: project.id === selectedProjectId ? '#f5f5f5' : '#fff',
                  border: '1.5px solid #e5e5e5',
                  borderRadius: 14,
                  padding: '20px 24px',
                  marginBottom: 16,
                  boxShadow: project.id === selectedProjectId ? '0 0 0 2px #b3b3b3' : 'none',
                  cursor: systemProjectIds.includes(project.id) ? 'default' : 'pointer',
                  transition: 'box-shadow 0.2s',
                  color: '#111',
                  position: 'relative',
                  minHeight: 80
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 600, fontSize: 20 }}>
                  <span>{project.name}</span>
                  <span style={{ fontWeight: 400, fontSize: 18, color: '#888' }}>Level {project.current_level}</span>
                </div>
                <div style={{ margin: '16px 0 8px 0', height: 8, background: '#eee', borderRadius: 6, overflow: 'hidden' }}>
                  <div style={{ width: `${progress * 100}%`, height: '100%', background: '#111', borderRadius: 6, transition: 'width 0.3s' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#888', fontWeight: 500, fontSize: 15 }}>
                  <span>&nbsp;</span>
                  <span>{project.current_xp} / {nextLevelXP} XP</span>
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
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleAddProject} variant="contained" color="primary" disabled={!newProjectName.trim()}>
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
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button onClick={handleDeleteProject} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default ProjectColumn; 