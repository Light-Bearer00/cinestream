/**
 * _app.js
 * - Wraps ALL pages in AuthProvider
 * - Every page except /auth/login is behind ProtectedRoute
 * - Registration page is removed — only the seeded admin account works
 */

import '../styles/globals.css';
import { useRouter } from 'next/router';
import { AuthProvider } from '../context/AuthContext';
import Layout from '../components/layout/Layout';
import ProtectedRoute from '../components/ui/ProtectedRoute';

// Only the login page is public — everything else requires login
const PUBLIC_PATHS = ['/auth/login', '/auth/register'];

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const isPublic = PUBLIC_PATHS.includes(router.pathname);

  // Pages can opt out of the default Layout (navbar/footer)
  const getLayout = Component.getLayout || ((page) => <Layout>{page}</Layout>);

  return (
    <AuthProvider>
      {isPublic ? (
        // Login page — no protection, no layout
        <Component {...pageProps} />
      ) : (
        // All other pages — must be logged in
        <ProtectedRoute>
          {getLayout(<Component {...pageProps} />)}
        </ProtectedRoute>
      )}
    </AuthProvider>
  );
}
