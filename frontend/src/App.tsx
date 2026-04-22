/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.tsx';
import { MarketProvider } from './context/MarketContext.tsx';
import ProtectedRoute from './components/layout/ProtectedRoute.tsx';
import LoginPage from './pages/LoginPage.tsx';
import RegisterPage from './pages/RegisterPage.tsx';
import DashboardPage from './pages/DashboardPage.tsx';
import TradePage from './pages/TradePage.tsx';
import WalletPage from './pages/WalletPage.tsx';
import OrdersPage from './pages/OrdersPage.tsx';

export default function App() {
  return (
    <AuthProvider>
      <MarketProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/trade" element={<TradePage />} />
              <Route path="/wallet" element={<WalletPage />} />
              <Route path="/orders" element={<OrdersPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </MarketProvider>
    </AuthProvider>
  );
}
