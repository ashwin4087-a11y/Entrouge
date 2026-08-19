import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { SimulationProvider } from '@/context/SimulationContext'
import { DigitalTwinPage } from '@/pages/DigitalTwinPage'
import { ReportDetailPage } from '@/pages/ReportDetailPage'
import { ReportsPage } from '@/pages/ReportsPage'

export default function App() {
  return (
    <SimulationProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/digital-twin" replace />} />
          <Route path="/digital-twin" element={<DigitalTwinPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/reports/:id" element={<ReportDetailPage />} />
        </Routes>
      </BrowserRouter>
    </SimulationProvider>
  )
}
