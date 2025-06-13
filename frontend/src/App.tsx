import React, { useState } from 'react'
import DashboardColumn from './pages/dashboard/dashboard'
import ProjectColumn from './pages/project/project'
import PlanFactColumns from "./pages/planner/planner"
import WeekColumn from './pages/week/week'
import './App.css'
import { Button } from '@mui/material'
import axios from 'axios'

function App() {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all_projects')
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [cleaning, setCleaning] = useState(false)

  const handleCleanDB = async () => {
    setCleaning(true)
    try {
      await axios.delete('http://localhost:8000/clean')
      window.location.reload()
    } catch {
      alert('Failed to clean DB')
    } finally {
      setCleaning(false)
    }
  }

  return (
    <div className="app-container" style={{ background: '#fafafa', minHeight: '100vh', padding: 32 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 32, alignItems: 'center', justifyContent: 'center', maxWidth: 1200, margin: '0 auto' }}>
      <DashboardColumn 
          selectedProjectId={selectedProjectId}
          selectedDate={selectedDate}
        />
        <ProjectColumn 
          onProjectSelect={setSelectedProjectId}
          selectedProjectId={selectedProjectId}
        />

        <div style={{ display: 'flex', flexDirection: 'row', gap: 24, width: '100%', alignItems: 'flex-start', justifyContent: 'center' }}>
          <div style={{ flex: 1, minWidth: 350 }}>
            <PlanFactColumns 
              selectedProjectId={selectedProjectId}
              selectedDate={selectedDate}
            />
          </div>
        </div>
        <WeekColumn 
          onDateSelect={setSelectedDate}
          selectedDate={selectedDate}
          selectedProjectId={selectedProjectId}
        />
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Button variant="outlined" color="error" onClick={handleCleanDB} disabled={cleaning}>
            {cleaning ? 'Cleaning...' : 'Clean DB'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default App
