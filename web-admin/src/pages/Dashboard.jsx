import { Link, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const { user, logout } = useAuth()

  return (
    <div style={styles.wrapper}>
      <aside style={styles.sidebar}>
        <h2 style={styles.logo}>🏨 Hotel Admin</h2>
        <nav style={styles.nav}>
          <Link style={styles.link} to="/">Overview</Link>
          <Link style={styles.link} to="/menu">Menu Management</Link>
          <Link style={styles.link} to="/billing">Billing</Link>
        </nav>
        <div style={styles.userBox}>
          <div style={styles.userName}>{user?.username}</div>
          <div style={styles.userRole}>{user?.role}</div>
          <button style={styles.logoutBtn} onClick={logout}>Log out</button>
        </div>
      </aside>
      <main style={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}

const styles = {
  wrapper: { display: 'flex', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' },
  sidebar: {
    width: 220,
    background: '#111827',
    color: '#fff',
    padding: '1.5rem 1rem',
    display: 'flex',
    flexDirection: 'column',
  },
  logo: { fontSize: 18, marginBottom: 24 },
  nav: { display: 'flex', flexDirection: 'column', gap: 4, flex: 1 },
  link: {
    color: '#e5e7eb',
    textDecoration: 'none',
    padding: '10px 12px',
    borderRadius: 8,
    fontSize: 14,
  },
  userBox: { borderTop: '1px solid #374151', paddingTop: 12 },
  userName: { fontSize: 14, fontWeight: 600 },
  userRole: { fontSize: 12, color: '#9ca3af', marginBottom: 10 },
  logoutBtn: {
    width: '100%',
    padding: '8px',
    borderRadius: 6,
    border: 'none',
    background: '#374151',
    color: '#fff',
    cursor: 'pointer',
    fontSize: 13,
  },
  main: { flex: 1, padding: '2rem', background: '#f9fafb' },
}
