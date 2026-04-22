import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import MerchantListPage from './pages/MerchantListPage';
import MerchantAssessmentPage from './pages/MerchantAssessmentPage';
import ReportsPage from './pages/ReportsPage';
import AdminShell from './components/AdminShell';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AdminShell />}>
            <Route path="/merchants" element={<MerchantListPage />} />
            <Route path="/merchants/:id" element={<MerchantAssessmentPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/" element={<Navigate to="/merchants" replace />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/merchants" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
