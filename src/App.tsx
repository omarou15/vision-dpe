import { FC } from 'react'
import { Routes, Route } from 'react-router-dom'

// Pages
import { DashboardPage } from './pages/dashboard/DashboardPage'
import { WizardPage } from './pages/wizard/WizardPage'
import { AuthPage } from './pages/auth/AuthPage'

const App: FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/wizard/:projectId" element={<WizardPage />} />
        <Route path="/wizard/:projectId/:step" element={<WizardPage />} />
      </Routes>
    </div>
  )
}

export default App