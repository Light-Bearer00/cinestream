/**
 * Register Page
 */

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuth } from '../../context/AuthContext';
import { MdLocalMovies } from 'react-icons/md';
import { FiMail, FiLock, FiUser, FiEye, FiEyeOff } from 'react-icons/fi';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await register(username, email, password);
      router.push('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head><title>Register — CineStream</title></Head>

      <div className="min-h-screen flex items-center justify-center px-4 bg-cinema-black">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-cinema-accent/5 rounded-full blur-3xl" />
        </div>

        <div className="relative w-full max-w-md animate-slide-up">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2">
              <MdLocalMovies className="text-cinema-accent text-3xl" />
              <span className="text-2xl text-white" style={{ fontFamily: 'Bebas Neue, serif', letterSpacing: '0.15em' }}>
                CINESTREAM
              </span>
            </Link>
          </div>

          <div className="bg-cinema-card border border-cinema-border rounded-2xl p-8 shadow-2xl">
            <h1 className="text-2xl font-semibold text-white mb-2">Create account</h1>
            <p className="text-cinema-muted text-sm mb-6">Start streaming today</p>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl mb-5">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-cinema-muted text-xs block mb-1.5">Username</label>
                <div className="relative">
                  <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-cinema-muted" size={16} />
                  <input
                    type="text"
                    required
                    minLength={3}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="yourname"
                    className="w-full bg-cinema-dark border border-cinema-border rounded-xl pl-9 pr-4 py-3 text-cinema-text placeholder-cinema-muted outline-none focus:border-cinema-accent transition-colors text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-cinema-muted text-xs block mb-1.5">Email</label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-cinema-muted" size={16} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-cinema-dark border border-cinema-border rounded-xl pl-9 pr-4 py-3 text-cinema-text placeholder-cinema-muted outline-none focus:border-cinema-accent transition-colors text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-cinema-muted text-xs block mb-1.5">Password</label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-cinema-muted" size={16} />
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="w-full bg-cinema-dark border border-cinema-border rounded-xl pl-9 pr-10 py-3 text-cinema-text placeholder-cinema-muted outline-none focus:border-cinema-accent transition-colors text-sm"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-cinema-muted">
                    {showPass ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-cinema-accent hover:bg-red-700 text-white font-semibold py-3 rounded-xl transition-all mt-2 disabled:opacity-50"
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>

            <p className="text-cinema-muted text-sm text-center mt-6">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-cinema-accent hover:underline">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

RegisterPage.getLayout = (page) => page;
