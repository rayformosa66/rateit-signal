import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import MerchantListPage from './pages/MerchantListPage';
import MerchantDetailPage from './pages/MerchantDetailPage';
import AdminShell from './components/AdminShell';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<AdminShell />}>
          <Route path="/merchants" element={<MerchantListPage />} />
          <Route path="/merchants/:id" element={<MerchantDetailPage />} />
          <Route path="/" element={<Navigate to="/merchants" replace />} />
        </Route>
        <Route path="*" element={<Navigate to="/merchants" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
