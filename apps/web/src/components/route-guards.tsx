import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';

export function RequireAuth({ children }: { children: JSX.Element }) {
  const { token, initializing } = useAuth();

  if (initializing) {
    return <div className="centered-message">Loading session...</div>;
  }

  if (!token) {
    return <Navigate to="/auth" replace />;
  }

  return children;
}

export function RequireRole({
  children,
  roles,
}: {
  children: JSX.Element;
  roles: string[];
}) {
  const { user, initializing } = useAuth();

  if (initializing) {
    return <div className="centered-message">Loading permissions...</div>;
  }

  const allowed = !!user?.roles?.some((role) => roles.includes(role.name));

  if (!allowed) {
    return (
      <section className="card panel">
        <h2>Access denied</h2>
        <p className="muted">This section requires one of these roles: {roles.join(', ')}.</p>
      </section>
    );
  }

  return children;
}
