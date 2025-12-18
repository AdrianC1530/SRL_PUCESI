import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { AdminDashboard } from './pages/admin/Dashboard';
import { LabsManagement } from './pages/admin/LabsManagement';
import { SoftwareManagement } from './pages/admin/SoftwareManagement';
import { SchoolsManagement } from './pages/admin/SchoolsManagement';
import { TeachersManagement } from './pages/admin/TeachersManagement';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/labs" element={<LabsManagement />} />
        <Route path="/admin/software" element={<SoftwareManagement />} />
        <Route path="/admin/schools" element={<SchoolsManagement />} />
        <Route path="/admin/teachers" element={<TeachersManagement />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
