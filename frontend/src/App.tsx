import React, { useState } from 'react'
import DashboardColumn from './pages/dashboard/dashboard'
import ProjectColumn from './pages/project/project'
import PlanFactColumns from "./pages/planner/planner"
import WeekColumn from './pages/week/week'
import './App.css'

function App() {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all_projects')
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  return (
    <div className="app-container">
      <div className="columns-layout">
        <DashboardColumn 
          selectedProjectId={selectedProjectId}
          selectedDate={selectedDate}
        />
        <ProjectColumn 
          onProjectSelect={setSelectedProjectId}
          selectedProjectId={selectedProjectId}
        />
        <div className="horizontal-columns">
          <PlanFactColumns 
            selectedProjectId={selectedProjectId}
            selectedDate={selectedDate}
          />
        </div>
        <WeekColumn 
          onDateSelect={setSelectedDate}
          selectedDate={selectedDate}
        />
      </div>
    </div>
  )
}

export default App
