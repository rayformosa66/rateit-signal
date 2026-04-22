import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setToken } from '../lib/auth';

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('reviewer@rateit.internal');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (res.status === 401) {
        setError('Invalid email or password.');
        return;
      }
      if (!res.ok) {
        setError('Login failed. Is the API running?');
        return;
      }

      const data = (await res.json()) as { token: string };
      setToken(data.token);
      navigate('/merchants');
    } catch {
      setError('Could not reach the API. Ensure it is running on port 3001.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>RateIt Admin</h1>
        <p>Sign in to manage merchants and assessments.</p>

        {error && (
          <div className="save-error" role="alert" style={{ marginBottom: 16 }}>
            {error}
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              autoComplete="current-password"
            />
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
