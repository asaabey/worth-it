import { useEffect } from 'react';
import { useStore } from './store/useStore';
import { CountrySelect } from './components/CountrySelect';
import { Dashboard } from './components/Dashboard';

function App() {
  const country = useStore((s) => s.country);
  const theme = useStore((s) => s.theme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'light');
    root.classList.add(theme);
  }, [theme]);

  return country ? <Dashboard /> : <CountrySelect />;
}

export default App;
