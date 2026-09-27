import { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Empty, ErrorMessage, formatDate, formatMoney, Loading, StatCard, Status } from '../components/Ui';

const messageOf = (error) => error.response?.data?.message || 'Something went wrong. Please try again.';

function useRemote(path) {
  const [state, setState] = useState({ loading: true, data: null, error: '' });
  const refresh = async () => {
    setState((current) => ({ ...current, loading: true, error: '' }));
    try { const { data } = await apiClient.get(path); setState({ loading: false, data: data.data, error: '' }); }
    catch (error) { setState({ loading: false, data: null, error: messageOf(error) }); }
  };
  useEffect(() => { refresh(); }, [path]);
  return { ...state, refresh };
}

function PageHeader({ title, detail, children }) {
  return <header className="page-header"><div><h1>{title}</h1><p>{detail}</p></div>{children}</header>;
}

function InlineForm({ children, onSubmit, error }) {
  return <form className="data-form" onSubmit={onSubmit}>{children}<ErrorMessage error={error} /><button className="primary-button">Save</button></form>;
}

export function DashboardPage() {
  const { user } = useAuth();
  const { data, loading, error } = useRemote(`/dashboard/${user.role}`);
  if (loading) return <Loading />;
  if (error) return <ErrorMessage error={error} />;
  if (user.role === 'tenant') return <TenantDashboard data={data} />;
  const totals = data.totals;
  const cards = user.role === 'admin'
    ? [['Users', totals.totalUsers], ['Owners', totals.owners], ['Tenants', totals.tenants], ['Properties', totals.properties], ['Occupied units', totals.occupied], ['Vacant units', totals.vacant], ['Rent collected', formatMoney(totals.rentCollected)], ['Pending rent', formatMoney(totals.pendingRent)], ['Open maintenance', totals.maintenance]]
    : [['Properties', totals.properties], ['Total units', totals.totalUnits], ['Occupied units', totals.occupied], ['Vacant units', totals.vacant], ['Expected rent', formatMoney(totals.expectedRent)], ['Collected rent', formatMoney(totals.collectedRent)], ['Pending rent', formatMoney(totals.pendingRent)], ['Open maintenance', totals.maintenance]];
  const activity = user.role === 'admin' ? data.recentActivities : data.recentPayments;
  return <><PageHeader title={`${user.role === 'admin' ? 'Admin' : 'Owner'} dashboard`} detail="Your current property operations at a glance." /><section className="stat-grid">{cards.map(([label, value], index) => <StatCard key={label} label={label} value={value} tone={index % 3 === 1 ? 'green' : index % 3 === 2 ? 'violet' : 'blue'} />)}</section><section className="panel"><h2>{user.role === 'admin' ? 'Recent administrative activity' : 'Recent payments'}</h2>{activity?.length ? <div className="list">{activity.map((item) => <div key={item._id} className="list-row"><div><strong>{item.action?.replaceAll('.', ' ') || item.tenant?.name || 'Payment'}</strong><span>{item.actor?.name || item.unit?.unitNumber || ''}</span></div><span>{formatDate(item.createdAt || item.paidAt)}</span></div>)}</div> : <Empty />}</section></>;
}

function TenantDashboard({ data }) {
  const unit = data.unit;
  return <><PageHeader title="Tenant dashboard" detail="Your home, rent and maintenance overview." /><section className="stat-grid"><StatCard label="Monthly rent" value={formatMoney(unit?.rentAmount)} /><StatCard label="Next due date" value={formatDate(data.nextRent?.dueDate)} tone="green" /><StatCard label="Payment status" value={data.nextRent?.status || 'No dues'} tone="violet" /><StatCard label="Open requests" value={data.maintenance.filter((item) => ['open', 'in_progress'].includes(item.status)).length} /></section><section className="two-column"><article className="panel"><h2>Current home</h2>{unit ? <div className="details"><strong>{unit.property?.name} · Unit {unit.unitNumber}</strong><span>{unit.property?.address?.line1}, {unit.property?.address?.city}</span><span>Landlord: {unit.property?.owner?.name || '—'} · {unit.property?.owner?.phone || '—'}</span></div> : <Empty>You have not been assigned to a unit yet.</Empty>}</article><article className="panel"><h2>Recent notices</h2>{data.notices?.length ? data.notices.map((notice) => <div key={notice._id} className="notice-item"><strong>{notice.title}</strong><span>{notice.description}</span></div>) : <Empty />}</article></section></>;
}

export function PropertiesPage() {
  const { user } = useAuth(); const { data, loading, error, refresh } = useRemote('/properties');
  const [form, setForm] = useState({ name: '', line1: '', city: '', state: '', postalCode: '', description: '' }); const [formError, setFormError] = useState('');
  const submit = async (event) => { event.preventDefault(); setFormError(''); try { await apiClient.post('/properties', { name: form.name, address: { line1: form.line1, city: form.city, state: form.state, postalCode: form.postalCode }, description: form.description }); setForm({ name: '', line1: '', city: '', state: '', postalCode: '', description: '' }); refresh(); } catch (error) { setFormError(messageOf(error)); } };
  return <><PageHeader title="Properties" detail="Buildings and addresses in your portfolio." />{user.role !== 'tenant' && <InlineForm onSubmit={submit} error={formError}><input required placeholder="Property name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /><input required placeholder="Address" value={form.line1} onChange={(e) => setForm({ ...form, line1: e.target.value })} /><input required placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /><input placeholder="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} /><input placeholder="Postal code" value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} /><input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></InlineForm>}{loading ? <Loading /> : error ? <ErrorMessage error={error} /> : <section className="cards">{data.items.length ? data.items.map((property) => <article key={property._id} className="panel property-card"><h2>{property.name}</h2><p>{property.address.line1}, {property.address.city}</p><span>Owner: {property.owner?.name || 'You'}</span><Status value={property.status} /></article>) : <Empty>No properties available.</Empty>}</section>}</>;
}

export function UnitsPage() {
  const { user } = useAuth(); const units = useRemote('/units'); const properties = useRemote('/properties'); const [error, setError] = useState(''); const [form, setForm] = useState({ propertyId: '', unitNumber: '', floor: '', type: 'other', rentAmount: '', securityDeposit: '' });
  const submit = async (event) => { event.preventDefault(); try { await apiClient.post('/units', form); setForm({ propertyId: '', unitNumber: '', floor: '', type: 'other', rentAmount: '', securityDeposit: '' }); units.refresh(); } catch (err) { setError(messageOf(err)); } };
  return <><PageHeader title="Units" detail="Apartment availability, rent and tenant assignment." />{user.role !== 'tenant' && <InlineForm onSubmit={submit} error={error}><select required value={form.propertyId} onChange={(e) => setForm({ ...form, propertyId: e.target.value })}><option value="">Select property</option>{properties.data?.items.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}</select><input required placeholder="Unit number" value={form.unitNumber} onChange={(e) => setForm({ ...form, unitNumber: e.target.value })} /><input placeholder="Floor" value={form.floor} onChange={(e) => setForm({ ...form, floor: e.target.value })} /><select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>{['other', 'studio', '1bhk', '2bhk', '3bhk'].map((item) => <option key={item}>{item}</option>)}</select><input required type="number" min="0" placeholder="Monthly rent" value={form.rentAmount} onChange={(e) => setForm({ ...form, rentAmount: e.target.value })} /><input type="number" min="0" placeholder="Security deposit" value={form.securityDeposit} onChange={(e) => setForm({ ...form, securityDeposit: e.target.value })} /></InlineForm>}{units.loading ? <Loading /> : units.error ? <ErrorMessage error={units.error} /> : <Table headers={['Unit', 'Property', 'Rent', 'Tenant', 'Status', 'Assignment']} rows={units.data.items.map((unit) => [unit.unitNumber, unit.property?.name, formatMoney(unit.rentAmount), unit.currentTenant?.name || 'Unassigned', <Status value={unit.status} />, user.role !== 'tenant' ? <AssignTenantControl unit={unit} refresh={units.refresh} /> : ''])} empty="No units available." />}</>;
}

function AssignTenantControl({ unit, refresh }) {
  const [tenantId, setTenantId] = useState(''); const [error, setError] = useState('');
  const assign = async () => { try { await apiClient.patch(`/units/${unit._id}/tenant`, { tenantId }); setError(''); setTenantId(''); refresh(); } catch (err) { setError(messageOf(err)); } };
  const remove = async () => { if (!window.confirm('Remove the tenant from this unit?')) return; try { await apiClient.delete(`/units/${unit._id}/tenant`); refresh(); } catch (err) { setError(messageOf(err)); } };
  return <div className="assignment-control">{unit.currentTenant ? <button className="text-button" onClick={remove}>Unassign</button> : <><input aria-label={`Tenant ID for unit ${unit.unitNumber}`} placeholder="Tenant ID" value={tenantId} onChange={(e) => setTenantId(e.target.value)} /><button className="text-button" disabled={!tenantId} onClick={assign}>Assign</button></>}{error && <small className="inline-error">{error}</small>}</div>;
}

export function RentPage() {
  const { user } = useAuth(); const records = useRemote('/rent'); const units = useRemote('/units'); const [error, setError] = useState(''); const [form, setForm] = useState({ unitId: '', billingMonth: new Date().toISOString().slice(0, 7), amount: '', dueDate: '' });
  const create = async (event) => { event.preventDefault(); try { await apiClient.post('/rent', form); records.refresh(); } catch (err) { setError(messageOf(err)); } };
  const paid = async (id) => { try { await apiClient.patch(`/rent/${id}/payment`, { paymentMethod: 'upi' }); records.refresh(); } catch (err) { setError(messageOf(err)); } };
  return <><PageHeader title="Rent management" detail="Track monthly bills, collections and overdue balances." />{user.role !== 'tenant' && <InlineForm onSubmit={create} error={error}><select required value={form.unitId} onChange={(e) => setForm({ ...form, unitId: e.target.value })}><option value="">Select occupied unit</option>{units.data?.items.filter((unit) => unit.currentTenant).map((unit) => <option key={unit._id} value={unit._id}>{unit.property?.name} · {unit.unitNumber}</option>)}</select><input required type="month" value={form.billingMonth} onChange={(e) => setForm({ ...form, billingMonth: e.target.value })} /><input required type="number" min="1" placeholder="Amount" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /><input required type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></InlineForm>}{records.loading ? <Loading /> : <Table headers={['Month', 'Unit', 'Tenant', 'Amount', 'Due', 'Status', '']} rows={records.data?.items.map((record) => [record.billingMonth, record.unit?.unitNumber, record.tenant?.name || 'You', formatMoney(record.amount), formatDate(record.dueDate), <Status value={record.status} />, user.role !== 'tenant' && record.status !== 'paid' ? <button className="text-button" onClick={() => paid(record._id)}>Mark paid</button> : ''])} empty="No rent records yet." />}</>;
}

export function MaintenancePage() {
  const { user } = useAuth(); const requests = useRemote('/maintenance'); const units = useRemote('/units'); const [error, setError] = useState(''); const [form, setForm] = useState({ unitId: '', category: 'other', priority: 'medium', description: '' });
  const create = async (event) => { event.preventDefault(); try { await apiClient.post('/maintenance', form); setForm({ unitId: '', category: 'other', priority: 'medium', description: '' }); requests.refresh(); } catch (err) { setError(messageOf(err)); } };
  const advance = async (item) => { try { await apiClient.patch(`/maintenance/${item._id}`, { status: item.status === 'open' ? 'in_progress' : 'resolved' }); requests.refresh(); } catch (err) { setError(messageOf(err)); } };
  return <><PageHeader title="Maintenance" detail="Submit, assign and resolve apartment maintenance requests." />{user.role === 'tenant' && <InlineForm onSubmit={create} error={error}><select required value={form.unitId} onChange={(e) => setForm({ ...form, unitId: e.target.value })}><option value="">Select your unit</option>{units.data?.items.map((unit) => <option key={unit._id} value={unit._id}>{unit.property?.name} · {unit.unitNumber}</option>)}</select><select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{['other', 'plumbing', 'electrical', 'appliance', 'cleaning', 'security'].map((item) => <option key={item}>{item}</option>)}</select><select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>{['low', 'medium', 'high', 'urgent'].map((item) => <option key={item}>{item}</option>)}</select><textarea required minLength="5" placeholder="Describe the issue" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></InlineForm>}{requests.loading ? <Loading /> : <Table headers={['Issue', 'Unit', 'Tenant', 'Priority', 'Status', '']} rows={requests.data?.items.map((item) => [item.category, item.unit?.unitNumber, item.tenant?.name || 'You', <Status value={item.priority} />, <Status value={item.status} />, user.role !== 'tenant' && !['resolved', 'rejected'].includes(item.status) ? <button className="text-button" onClick={() => advance(item)}>{item.status === 'open' ? 'Start' : 'Resolve'}</button> : ''])} empty="No maintenance requests." />}</>;
}

export function NoticesPage() {
  const { user } = useAuth(); const notices = useRemote('/notices'); const properties = useRemote('/properties'); const [error, setError] = useState(''); const [form, setForm] = useState({ propertyId: '', title: '', description: '', audience: 'all', expiresAt: '' });
  const create = async (event) => { event.preventDefault(); try { await apiClient.post('/notices', { ...form, propertyId: form.propertyId || undefined, expiresAt: form.expiresAt || null }); setForm({ propertyId: '', title: '', description: '', audience: 'all', expiresAt: '' }); notices.refresh(); } catch (err) { setError(messageOf(err)); } };
  return <><PageHeader title="Notices" detail="Updates and announcements relevant to your home or portfolio." />{user.role !== 'tenant' && <InlineForm onSubmit={create} error={error}><input required placeholder="Notice title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /><textarea required placeholder="Notice details" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />{user.role === 'owner' && <select required value={form.propertyId} onChange={(e) => setForm({ ...form, propertyId: e.target.value })}><option value="">Select property</option>{properties.data?.items.map((property) => <option key={property._id} value={property._id}>{property.name}</option>)}</select>}{user.role === 'admin' && <select value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })}>{['all', 'owners', 'tenants', 'property_tenants'].map((item) => <option key={item}>{item}</option>)}</select>}<input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} /></InlineForm>}{notices.loading ? <Loading /> : <section className="cards">{notices.data?.items.length ? notices.data.items.map((notice) => <article className="panel notice-card" key={notice._id}><div><h2>{notice.title}</h2><Status value={notice.audience} /></div><p>{notice.description}</p><span>Posted by {notice.author?.name} · {formatDate(notice.createdAt)}</span></article>) : <Empty>No notices found.</Empty>}</section>}</>;
}

export function UsersPage() {
  const users = useRemote('/admin/users'); const [error, setError] = useState(''); const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', role: 'tenant' });
  const toggle = async (item) => { try { await apiClient.patch(`/admin/users/${item._id}`, { name: item.name, phone: item.phone || '', role: item.role, isActive: !item.isActive }); users.refresh(); } catch (err) { setError(messageOf(err)); } };
  const create = async (event) => { event.preventDefault(); try { await apiClient.post('/admin/users', form); setForm({ name: '', email: '', password: '', phone: '', role: 'tenant' }); users.refresh(); } catch (err) { setError(messageOf(err)); } };
  return <><PageHeader title="Users" detail="Create accounts and manage platform roles and activation." /><InlineForm onSubmit={create} error={error}><input required placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /><input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /><input required type="password" minLength="8" placeholder="Temporary password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /><input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /><select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>{['tenant', 'owner', 'admin'].map((item) => <option key={item}>{item}</option>)}</select></InlineForm>{users.loading ? <Loading /> : <Table headers={['Name', 'Email', 'Role', 'Status', 'ID', '']} rows={users.data?.items.map((item) => [item.name, item.email, <Status value={item.role} />, <Status value={item.isActive ? 'active' : 'inactive'} />, <code>{item._id}</code>, <button className="text-button" onClick={() => toggle(item)}>{item.isActive ? 'Deactivate' : 'Activate'}</button>])} empty="No users found." />}</>;
}

export function ProfilePage() {
  const { user, setUser } = useAuth(); const [form, setForm] = useState({ name: user.name, phone: user.phone || '', avatarUrl: user.avatarUrl || '' }); const [error, setError] = useState(''); const [saved, setSaved] = useState('');
  const submit = async (event) => { event.preventDefault(); setError(''); try { const { data } = await apiClient.patch('/auth/me', form); setUser(data.data.user); setSaved('Profile saved.'); } catch (err) { setError(messageOf(err)); } };
  return <><PageHeader title="My profile" detail="Update your account contact details." /><InlineForm onSubmit={submit} error={error}><input required placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /><input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /><input placeholder="Avatar image URL" value={form.avatarUrl} onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })} />{saved && <p className="success-message">{saved}</p>}</InlineForm></>;
}

export function Table({ headers, rows = [], empty }) {
  if (!rows.length) return <Empty>{empty}</Empty>;
  return <div className="table-wrap"><table><thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>)}</tbody></table></div>;
}
