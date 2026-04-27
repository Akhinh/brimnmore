import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'

import { AdminLayout } from './components/layout/AdminLayout'
import { WorkerLayout } from './components/layout/WorkerLayout'
import { ProtectedRoute } from './components/layout/ProtectedRoute'

import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage'
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage'

import { DashboardPage } from './pages/admin/DashboardPage'
import { InventoryPage } from './pages/admin/InventoryPage'
import { OrdersPage } from './pages/admin/OrdersPage'
import { WorkersPage } from './pages/admin/WorkersPage'
import { AnalyticsPage } from './pages/admin/AnalyticsPage'
import { OrderLinksPage } from './pages/admin/OrderLinksPage'
import { RestockPage } from './pages/admin/RestockPage'
import { NotificationsPage } from './pages/admin/NotificationsPage'
import { SettingsPage } from './pages/admin/SettingsPage'
import { WorkerActivityPage } from './pages/admin/WorkerActivityPage'

import { StockPage } from './pages/worker/StockPage'
import { SellPage } from './pages/worker/SellPage'
import { SearchPage } from './pages/worker/SearchPage'
import { ActivityPage } from './pages/worker/ActivityPage'

import { OrderPortalPage } from './pages/customer/OrderPortalPage'

const qc = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1 } } })

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/order/:token" element={<OrderPortalPage />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Admin */}
          <Route path="/admin" element={<ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>}>
            <Route index element={<DashboardPage />} />
            <Route path="inventory" element={<InventoryPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="workers" element={<WorkersPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="order-links" element={<OrderLinksPage />} />
            <Route path="restock" element={<RestockPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="workers/:id/activity" element={<WorkerActivityPage />} />
          </Route>

          {/* Worker */}
          <Route path="/worker" element={<ProtectedRoute role="worker"><WorkerLayout /></ProtectedRoute>}>
            <Route index element={<StockPage />} />
            <Route path="sell" element={<SellPage />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="activity" element={<ActivityPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>

        <Toaster position="top-center" toastOptions={{
          duration: 3000,
          style: { fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '13px', borderRadius: '12px', background: '#0A0A0A', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' },
          success: { iconTheme: { primary: '#10B981', secondary: '#fff' } },
          error: { iconTheme: { primary: '#E8191A', secondary: '#fff' } },
        }} />
      </BrowserRouter>
    </QueryClientProvider>
  )
}
