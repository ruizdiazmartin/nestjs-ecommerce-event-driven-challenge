import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/app-layout';
import { RequireAuth, RequireRole } from './components/route-guards';
import { AuthProvider } from './lib/auth';
import { AdminRolesPage } from './pages/admin-roles-page';
import { AuthPage } from './pages/auth-page';
import { DashboardPage } from './pages/dashboard-page';
import { ProductCreatePage } from './pages/product-create-page';
import { ProductDetailPage } from './pages/product-detail-page';
import { ProductsPage } from './pages/products-page';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />

      <Route
        path="/"
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route
          path="products/new"
          element={
            <RequireRole roles={['Admin', 'Merchant']}>
              <ProductCreatePage />
            </RequireRole>
          }
        />
        <Route path="products/:id" element={<ProductDetailPage />} />
        <Route
          path="admin/roles"
          element={
            <RequireRole roles={['Admin']}>
              <AdminRolesPage />
            </RequireRole>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
