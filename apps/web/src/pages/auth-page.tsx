import { FormEvent, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { normalizeApiError } from '../lib/api';

type Mode = 'login' | 'register';

export function AuthPage() {
  const navigate = useNavigate();
  const { token, loginUser, registerUser } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (token) {
    return <Navigate to="/" replace />;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        await loginUser(email, password);
      } else {
        await registerUser(email, password);
      }
      navigate('/', { replace: true });
    } catch (err) {
      const apiError = normalizeApiError(err);
      setError(apiError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="card auth-card">
        <header className="auth-header">
          <p className="eyebrow">Challenge Demo</p>
          <h1 className="auth-title">E-commerce Console</h1>
          <p className="auth-subtitle">
            Login or register to explore role-aware flows and event-driven product lifecycle.
          </p>
        </header>

        <div className="tabs auth-tabs">
          <button
            type="button"
            className={mode === 'login' ? 'tab is-active' : 'tab'}
            onClick={() => setMode('login')}
          >
            Login
          </button>
          <button
            type="button"
            className={mode === 'register' ? 'tab is-active' : 'tab'}
            onClick={() => setMode('register')}
          >
            Register
          </button>
        </div>

        <form className="form-grid auth-form" onSubmit={onSubmit}>
          <label>
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              placeholder="name@company.com"
            />
          </label>

          <label>
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
              placeholder="At least 8 characters"
            />
          </label>

          {error && <p className="error-text">{error}</p>}

          <button type="submit" className="primary-btn" disabled={loading}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Create account'}
          </button>
        </form>

        <p className="auth-note">
          Tip: use <code>Admin</code> role to access role assignment and full product management.
        </p>
      </section>
    </main>
  );
}
