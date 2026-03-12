/**
 * Login Page — the only entry point to the site.
 * Registration is disabled; only the seeded admin account can log in.
 */

import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuth } from '../../context/AuthContext';
import { MdLocalMovies } from 'react-icons/md';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';

export default function LoginPage() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const { login } = useAuth();
  const router    = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.replace('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head><title>Sign In — CineStream</title></Head>

      <div className="min-h-screen bg-cinema-black flex items-center justify-center px-4">
        {/* Background glow effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-cinema-accent/5 rounded-full blur-3xl" />
        </div>

        <div className="relative w-full max-w-md animate-slide-up">

          {/* Logo */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-3">
              <MdLocalMovies className="text-cinema-accent text-4xl" />
              <span
                className="text-3xl text-white"
                style={{ fontFamily: 'Bebas Neue, serif', letterSpacing: '0.2em' }}
              >
                CINESTREAM
              </span>
            </div>
            <p className="text-cinema-muted text-sm mt-2">Private streaming — members only</p>
          </div>

          {/* Card */}
          <div className="bg-cinema-card border border-cinema-border rounded-2xl p-8 shadow-2xl">
            <h1 className="text-xl font-semibold text-white mb-1">Welcome back</h1>
            <p className="text-cinema-muted text-sm mb-6">Sign in to continue watching</p>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl mb-5">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="text-cinema-muted text-xs block mb-1.5">Email</label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-cinema-muted" size={16} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full bg-cinema-dark border border-cinema-border rounded-xl pl-9 pr-4 py-3 text-cinema-text placeholder-cinema-muted outline-none focus:border-cinema-accent transition-colors text-sm"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="text-cinema-muted text-xs block mb-1.5">Password</label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-cinema-muted" size={16} />
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-cinema-dark border border-cinema-border rounded-xl pl-9 pr-10 py-3 text-cinema-text placeholder-cinema-muted outline-none focus:border-cinema-accent transition-colors text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-cinema-muted hover:text-cinema-text transition-colors"
                  >
                    {showPass ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-cinema-accent hover:bg-red-700 text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-50 mt-2"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          </div>

          <p className="text-cinema-muted text-xs text-center mt-6">
            This is a private platform. Access is restricted.
          </p>
        </div>
      </div>
    </>
  );
}

// No layout wrapper for login page
LoginPage.getLayout = (page) => page;
