import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import TablesPage from './pages/TablesPage';
import OrderPage from './pages/OrderPage';
import MenuPage from './pages/MenuPage';
import DashboardPage from './pages/DashboardPage';
import TransactionHistoryPage from './pages/Transaction History';
import KitchenPage from './pages/KitchenPage';
import StaffPage from './pages/StaffPage';
import SettingsPage from './pages/SettingsPage';


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={<TablesPage />} />
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/history" element={<TransactionHistoryPage />} />
        <Route path="/order/:tableId" element={<OrderPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/kitchen" element={<KitchenPage />} />
        <Route path="/settings" element={<SettingsPage />} />

        <Route path="/staff" element={<StaffPage />} />
      </Routes>
    </BrowserRouter>
  );
}