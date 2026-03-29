import { NavLink, Outlet } from 'react-router-dom';

export default function AdminShell() {
  return (
    <div style={styles.container}>
      <aside style={styles.sidebar}>
        <div style={styles.logo}>
          <span style={styles.logoText}>RateIt</span>
          <span style={styles.logoSub}>Admin</span>
        </div>
        <nav style={styles.nav}>
          <NavLink
            to="/admin/merchants"
            style={({ isActive }) => ({
              ...styles.navLink,
              ...(isActive ? styles.navLinkActive : {}),
            })}
          >
            Merchants
          </NavLink>
        </nav>
        <div style={styles.sidebarFooter}>
          <span style={styles.footerText}>RateIt Signal v0.1</span>
        </div>
      </aside>
      <div style={styles.main}>
        <header style={styles.header}>
          <span style={styles.headerTitle}>RateIt Admin Dashboard</span>
          <span style={styles.headerUser}>reviewer@rateit.internal</span>
        </header>
        <main style={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    backgroundColor: '#f5f6fa',
    color: '#1a1a2e',
  },
  sidebar: {
    width: '220px',
    backgroundColor: '#1a1a2e',
    color: '#e8e8f0',
    display: 'flex',
    flexDirection: 'column',
    padding: '0',
    flexShrink: 0,
  },
  logo: {
    padding: '24px 20px',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    display: 'flex',
    flexDirection: 'column',
  },
  logoText: {
    fontSize: '22px',
    fontWeight: 700,
    letterSpacing: '-0.5px',
    color: '#fff',
  },
  logoSub: {
    fontSize: '12px',
    color: '#8888a8',
    textTransform: 'uppercase',
    letterSpacing: '2px',
  },
  nav: {
    padding: '16px 0',
    flex: 1,
  },
  navLink: {
    display: 'block',
    padding: '10px 20px',
    color: '#b0b0c8',
    textDecoration: 'none',
    fontSize: '14px',
    borderLeft: '3px solid transparent',
    transition: 'all 0.15s',
  },
  navLinkActive: {
    color: '#fff',
    borderLeftColor: '#6c63ff',
    backgroundColor: 'rgba(108, 99, 255, 0.12)',
  },
  sidebarFooter: {
    padding: '16px 20px',
    borderTop: '1px solid rgba(255,255,255,0.1)',
  },
  footerText: {
    fontSize: '11px',
    color: '#555577',
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  header: {
    backgroundColor: '#fff',
    borderBottom: '1px solid #e0e0ea',
    padding: '16px 32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontWeight: 600,
    fontSize: '16px',
  },
  headerUser: {
    fontSize: '13px',
    color: '#666',
  },
  content: {
    padding: '32px',
    flex: 1,
  },
};
