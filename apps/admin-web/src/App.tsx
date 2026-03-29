import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminShell from './components/AdminShell';
import LoginPage from './pages/LoginPage';
import MerchantListPage from './pages/MerchantListPage';
import MerchantDetailPage from './pages/MerchantDetailPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin" element={<AdminShell />}>
          <Route index element={<Navigate to="merchants" replace />} />
          <Route path="merchants" element={<MerchantListPage />} />
          <Route path="merchants/:id" element={<MerchantDetailPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/admin/merchants" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
