import { useState } from 'react';
import { Navigate, NavLink, Outlet, Route, Routes, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import { DashboardPage, MaintenancePage, NoticesPage, ProfilePage, PropertiesPage, RentPage, UnitsPage, UsersPage } from './pages/Pages';
import { ErrorMessage, Loading } from './components/Ui';

const links = [['Dashboard', '/app', ['admin', 'owner', 'tenant']], ['Properties', '/app/properties', ['admin', 'owner', 'tenant']], ['Units', '/app/units', ['admin', 'owner', 'tenant']], ['Rent', '/app/rent', ['admin', 'owner', 'tenant']], ['Maintenance', '/app/maintenance', ['admin', 'owner', 'tenant']], ['Notices', '/app/notices', ['admin', 'owner', 'tenant']], ['Users', '/app/users', ['admin']], ['Profile', '/app/profile', ['admin', 'owner', 'tenant']]];

function AuthPage({ mode }) {
  const { login, register, loading, user } = useAuth(); const navigate = useNavigate(); const [error, setError] = useState(''); const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', role: 'tenant' });
  if (loading) return <Loading />;
  if (user) return <Navigate to="/app" replace />;
  const submit = async (event) => { event.preventDefault(); setError(''); try { const signedIn = mode === 'login' ? await login({ email: form.email, password: form.password }) : await register(form); navigate('/app', { replace: true, state: { role: signedIn.role } }); } catch (err) { setError(err.response?.data?.message || 'Unable to continue.'); } };
  return <main className="auth-page"><section className="auth-panel"><p className="eyebrow">Apartment Management</p><h1>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1><p className="muted">{mode === 'login' ? 'Sign in to manage your apartment operations.' : 'Register as an owner or tenant to get started.'}</p><form className="auth-form" onSubmit={submit}>{mode === 'register' && <><input required placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /><input placeholder="Phone number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /><select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}><option value="tenant">Tenant</option><option value="owner">Owner / landlord</option></select></>}<input required type="email" placeholder="Email address" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /><input required type="password" minLength="8" placeholder="Password (8+ characters)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /><ErrorMessage error={error} /><button className="primary-button">{mode === 'login' ? 'Sign in' : 'Create account'}</button></form><p className="auth-switch">{mode === 'login' ? 'New here?' : 'Already have an account?'} <NavLink to={mode === 'login' ? '/register' : '/login'}>{mode === 'login' ? 'Create an account' : 'Sign in'}</NavLink></p></section></main>;
}

function AppLayout() {
  const { user, logout } = useAuth(); const navigate = useNavigate(); const [open, setOpen] = useState(false);
  const signOut = async () => { await logout(); navigate('/login'); };
  return <div className="app-layout"><header className="mobile-header"><strong>Apartment Manager</strong><button className="menu-button" onClick={() => setOpen(!open)}>Menu</button></header><aside className={`sidebar ${open ? 'open' : ''}`}><div className="brand"><span className="brand-mark">AM</span><strong>Apartment<br />Manager</strong></div><nav>{links.filter(([, , roles]) => roles.includes(user.role)).map(([label, to]) => <NavLink key={to} to={to} end={to === '/app'} onClick={() => setOpen(false)}>{label}</NavLink>)}</nav><div className="account"><span>{user.name}</span><small>{user.role}</small><button onClick={signOut}>Sign out</button></div></aside><main className="workspace"><Outlet /></main></div>;
}

export default function App() {
  return <Routes><Route path="/login" element={<AuthPage mode="login" />} /><Route path="/register" element={<AuthPage mode="register" />} /><Route element={<ProtectedRoute />}><Route path="/app" element={<AppLayout />}><Route index element={<DashboardPage />} /><Route path="properties" element={<PropertiesPage />} /><Route path="units" element={<UnitsPage />} /><Route path="rent" element={<RentPage />} /><Route path="maintenance" element={<MaintenancePage />} /><Route path="notices" element={<NoticesPage />} /><Route path="profile" element={<ProfilePage />} /><Route element={<ProtectedRoute roles={['admin']} />}><Route path="users" element={<UsersPage />} /></Route></Route></Route><Route path="*" element={<Navigate to="/app" replace />} /></Routes>;
}
