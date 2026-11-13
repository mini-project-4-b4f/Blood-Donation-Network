import { AuthProvider } from './context/AuthContext';
import { DonorProvider } from './context/DonorContext';
import { RequestsProvider } from './context/RequestsContext';
import { AppRouter } from './routes/AppRouter';

export default function App() {
  // AuthProvider is the outermost: the other two read the signed-in user from it.
  return (
    <AuthProvider>
      <DonorProvider>
        <RequestsProvider>
          <AppRouter />
        </RequestsProvider>
      </DonorProvider>
    </AuthProvider>
  );
}
