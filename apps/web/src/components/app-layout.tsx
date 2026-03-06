import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../lib/auth';

function navClassName({ isActive }: { isActive: boolean }) {
  return isActive ? 'nav-link is-active' : 'nav-link';
}

export function AppLayout() {
  const { user, logout, isAdmin, isMerchant } = useAuth();

  return (
    <div className="shell">
      <aside className="sidebar">
        <header className="brand">
          <p className="eyebrow">Challenge Demo</p>
          <h1>E-commerce Console</h1>
        </header>

        <nav className="nav">
          <NavLink to="/" end className={navClassName}>
            Dashboard
          </NavLink>
          <NavLink to="/products" className={navClassName}>
            Products
          </NavLink>
          {(isAdmin || isMerchant) && (
            <NavLink to="/products/new" className={navClassName}>
              Create Product
            </NavLink>
          )}
          {isAdmin && (
            <NavLink to="/admin/roles" className={navClassName}>
              Admin Roles
            </NavLink>
          )}
        </nav>
      </aside>

      <div className="content">
        <header className="topbar">
          <div>
            <p className="topbar-label">Logged in as</p>
            <p className="topbar-email">{user?.email ?? 'Unknown user'}</p>
          </div>

          <div className="topbar-actions">
            <div className="role-badges">
              {user?.roles?.map((role) => (
                <span key={role.id} className="badge">
                  {role.name}
                </span>
              ))}
            </div>
            <button type="button" className="secondary-btn" onClick={logout}>
              Logout
            </button>
          </div>
        </header>

        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
