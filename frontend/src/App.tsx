import { AuthProvider } from './context/AuthContext';
import { RequestsProvider } from './context/RequestsContext';
import AppRouter from './routes/AppRouter';

export default function App() {
  return (
    <AuthProvider>
      <RequestsProvider>
        <AppRouter />
      </RequestsProvider>
    </AuthProvider>
  );
}
