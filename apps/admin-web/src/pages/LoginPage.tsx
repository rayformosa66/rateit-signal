import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('reviewer@rateit.internal');
  const [password, setPassword] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Sprint 1: mock auth — accept any non-empty password
    if (password.trim()) {
      navigate('/merchants');
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>RateIt Admin</h1>
        <p>Sign in to manage merchants and assessments.</p>
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
              placeholder="Enter any password"
              required
              autoComplete="current-password"
            />
          </div>
          <button type="submit" className="btn btn-primary btn-full">
            Sign in
          </button>
        </form>
        <p style={{ fontSize: '12px', color: '#aaa' }}>Sprint 1 — mock authentication</p>
      </div>
    </div>
  );
}

export default LoginPage;
