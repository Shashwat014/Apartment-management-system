export function StatCard({ label, value, tone = 'blue' }) {
  return <article className={`stat-card ${tone}`}><span>{label}</span><strong>{value}</strong></article>;
}

export function Status({ value }) {
  return <span className={`badge ${String(value).replaceAll('_', '-')}`}>{String(value).replaceAll('_', ' ')}</span>;
}

export function Empty({ children = 'Nothing to show yet.' }) {
  return <p className="empty-state">{children}</p>;
}

export function Loading() {
  return <div className="page-loading">Loading…</div>;
}

export function ErrorMessage({ error }) {
  return error ? <p className="form-error" role="alert">{error}</p> : null;
}

export function formatMoney(value) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value || 0);
}

export function formatDate(value) {
  return value ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(value)) : '—';
}
