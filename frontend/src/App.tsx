import { AuthProvider } from './context/AuthContext';
import { RequestsProvider } from './context/RequestsContext';
import { LanguageProvider } from './context/LanguageContext';
import AppRouter from './routes/AppRouter';

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <RequestsProvider>
          <AppRouter />
        </RequestsProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
