import { useEffect, useState } from 'react';
import { apiClient } from './api/client';

const initialStatus = { state: 'loading', message: 'Checking API connection…' };

export default function App() {
  const [health, setHealth] = useState(initialStatus);

  useEffect(() => {
    let active = true;

    async function checkApiHealth() {
      try {
        const { data } = await apiClient.get('/health');
        if (active) {
          setHealth({ state: 'success', message: data.message });
        }
      } catch {
        if (active) {
          setHealth({
            state: 'error',
            message: 'API unavailable. Start the backend at http://localhost:5000.',
          });
        }
      }
    }

    checkApiHealth();
    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="app-shell">
      <section className="setup-card" aria-labelledby="app-title">
        <p className="eyebrow">Apartment Management System</p>
        <h1 id="app-title">Frontend setup complete</h1>
        <p className="description">
          React and Vite are ready. Authentication and management features will be added in later milestones.
        </p>
        <p className={`connection-status ${health.state}`} role="status">
          {health.message}
        </p>
      </section>
    </main>
  );
}
