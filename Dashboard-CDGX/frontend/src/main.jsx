// main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import Cibest from './pages/Cibest'
import Dashboard from './pages/Dashboard'
import LoginPage from './pages/LoginPage'
import AdminPanel from './pages/AdminPanel'
import VueEnsemble from './pages/comptage-passagers/VueEnsemble'
import AnalyseCamera from './pages/comptage-passagers/AnalyseCamera'
import Groupes from './pages/comptage-passagers/Groupes'
import Evenements from './pages/comptage-passagers/Evenements'
import RapportsExport from './pages/comptage-passagers/RapportsExport'
import { AuthProvider, useAuth } from './context/AuthContext'

const AdminRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user?.role !== 'admin') return <Navigate to="/cibest" replace />
  return children
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/cibest" replace />} />
          {/* <Route path="/dashboard" element={<Dashboard />} /> */}
          <Route path="/cibest" element={<Cibest />} />
          <Route path="/comptage-passagers/vue-ensemble" element={<VueEnsemble />} />
          <Route path="/comptage-passagers/analyse-camera" element={<AnalyseCamera />} />
          <Route path="/comptage-passagers/groupes" element={<Groupes />} />
          <Route path="/comptage-passagers/evenements" element={<Evenements />} />
          <Route path="/comptage-passagers/rapports" element={<RapportsExport />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin" element={
            <AdminRoute>
              <AdminPanel />
            </AdminRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
)
