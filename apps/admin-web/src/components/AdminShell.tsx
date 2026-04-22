import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { clearToken, getEmailFromToken } from '../lib/auth';

function AdminShell() {
  const navigate = useNavigate();
  const email = getEmailFromToken() ?? 'Admin';

  function handleLogout() {
    clearToken();
    navigate('/login');
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar-logo">RateIt Admin</div>
        <ul className="sidebar-nav">
          <li>
            <NavLink
              to="/merchants"
              className={({ isActive }) => (isActive ? 'active' : undefined)}
            >
              Merchants
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/reports"
              className={({ isActive }) => (isActive ? 'active' : undefined)}
            >
              Reports
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/how-we-rate"
              className={({ isActive }) => (isActive ? 'active' : undefined)}
            >
              How We Rate
            </NavLink>
          </li>
        </ul>
        <div style={{ padding: '16px 20px', borderTop: '1px solid #2d2d4e' }}>
          <button
            className="btn btn-secondary"
            style={{ width: '100%', justifyContent: 'center', color: '#c8ccd8', background: 'transparent', borderColor: '#2d2d4e' }}
            onClick={handleLogout}
          >
            Log out
          </button>
        </div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <span className="topbar-title">RateIt Signal</span>
          <span className="topbar-user">{email}</span>
        </header>

        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminShell;
