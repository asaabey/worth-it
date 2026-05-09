import { useStore } from './store/useStore';
import { CountrySelect } from './components/CountrySelect';
import { Dashboard } from './components/Dashboard';

function App() {
  const country = useStore((s) => s.country);
  return country ? <Dashboard /> : <CountrySelect />;
}

export default App;
