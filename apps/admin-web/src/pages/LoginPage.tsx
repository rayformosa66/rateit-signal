import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('reviewer@rateit.internal');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) {
      setError('Email is required.');
      return;
    }
    // Sprint 1: mock login — accept any non-empty email
    navigate('/admin/merchants');
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.heading}>RateIt Admin</h1>
        <p style={styles.subheading}>Sign in to manage merchants</p>
        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label} htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
          />
          <label style={styles.label} htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            placeholder="(any value — Sprint 1 mock)"
          />
          {error && <p style={styles.error}>{error}</p>}
          <button type="submit" style={styles.button}>Sign in</button>
        </form>
        <p style={styles.hint}>Sprint 1: authentication is mocked. Enter any email to proceed.</p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f6fa',
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '10px',
    padding: '40px 48px',
    boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
    width: '380px',
    maxWidth: '90vw',
  },
  heading: {
    margin: '0 0 4px',
    fontSize: '26px',
    fontWeight: 700,
    color: '#1a1a2e',
  },
  subheading: {
    margin: '0 0 28px',
    fontSize: '14px',
    color: '#666',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#444',
    marginTop: '8px',
  },
  input: {
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none',
  },
  error: {
    color: '#d63031',
    fontSize: '13px',
    margin: '4px 0 0',
  },
  button: {
    marginTop: '16px',
    padding: '12px',
    backgroundColor: '#6c63ff',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  hint: {
    marginTop: '20px',
    fontSize: '12px',
    color: '#999',
    textAlign: 'center',
  },
};
