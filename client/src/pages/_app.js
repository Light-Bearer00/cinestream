/**
 * _app.js
 * - Wraps ALL pages in AuthProvider
 * - Every page except /auth/login is behind ProtectedRoute
 */
import '../styles/globals.css';
import { useRouter } from 'next/router';
import { AuthProvider } from '../context/AuthContext';
import Layout from '../components/layout/Layout';
import ProtectedRoute from '../components/ui/ProtectedRoute';

const PUBLIC_PATHS = ['/auth/login', '/auth/register'];

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const isPublic = PUBLIC_PATHS.includes(router.pathname);
  const getLayout = Component.getLayout || ((page) => <Layout>{page}</Layout>);

  return (
    <AuthProvider>
      {isPublic ? (
        <Component {...pageProps} />
      ) : (
        <ProtectedRoute>
          {getLayout(<Component {...pageProps} />)}
        </ProtectedRoute>
      )}
    </AuthProvider>
  );
}
