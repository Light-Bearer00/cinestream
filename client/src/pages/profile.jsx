/**
 * User Profile Page
 * client/src/pages/profile.jsx
 */
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Image from 'next/image';
import { useAuth } from '../context/AuthContext';
import { getAllContinueWatching } from '../utils/watchProgress';
import { FiEdit2, FiCheck, FiX, FiFilm, FiTv, FiHeart, FiClock } from 'react-icons/fi';

const AVATARS = [
  '🎬','🎭','🎪','🦁','🐉','👑','🌙','⭐','🔥','💎',
  '🎯','🚀','🌊','🎸','🏆','🦊','🐺','🦅','🌺','⚡',
];

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [avatar, setAvatar]       = useState('🎬');
  const [editing, setEditing]     = useState(false);
  const [tempAvatar, setTempAvatar] = useState('🎬');
  const [continueWatching, setContinueWatching] = useState([]);
  const [activeTab, setActiveTab] = useState('activity');

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }
    const saved = localStorage.getItem(`rq_avatar_${user._id}`);
    if (saved) { setAvatar(saved); setTempAvatar(saved); }
    setContinueWatching(getAllContinueWatching());
  }, [user]);

  const saveAvatar = () => {
    setAvatar(tempAvatar);
    localStorage.setItem(`rq_avatar_${user._id}`, tempAvatar);
    setEditing(false);
  };

  if (!user) return null;

  const stats = [
    { label: 'In Progress', value: continueWatching.length, icon: FiClock },
    { label: 'Movies', value: continueWatching.filter(i => i.type === 'movie').length, icon: FiFilm },
    { label: 'TV Shows', value: continueWatching.filter(i => i.type === 'tv').length, icon: FiTv },
  ];

  return (
    <>
      <Head><title>{user.name} — RoyalQueen</title></Head>
      <div className="min-h-screen pt-24 pb-16 max-w-4xl mx-auto px-4">

        {/* Profile Header */}
        <div className="bg-cinema-card border border-cinema-border rounded-2xl p-6 mb-6">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl bg-cinema-dark border-2 border-cinema-accent flex items-center justify-center text-5xl select-none">
                {avatar}
              </div>
              <button
                onClick={() => setEditing(true)}
                className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-cinema-accent flex items-center justify-center hover:bg-red-700 transition-colors"
              >
                <FiEdit2 size={14} className="text-white" />
              </button>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl text-white font-bold">{user.name}</h1>
              <p className="text-cinema-muted text-sm mt-0.5">{user.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  user.role === 'admin'
                    ? 'bg-cinema-accent/20 text-cinema-accent border border-cinema-accent/40'
                    : 'bg-cinema-dark text-cinema-muted border border-cinema-border'
                }`}>
                  {user.role === 'admin' ? '👑 Admin' : '👤 Member'}
                </span>
                <span className="text-cinema-muted text-xs">
                  Joined {new Date(user.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
              </div>
            </div>

            <button
              onClick={logout}
              className="text-cinema-muted hover:text-white text-sm border border-cinema-border hover:border-white px-4 py-2 rounded-xl transition-all"
            >
              Sign Out
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-cinema-border">
            {stats.map((s, i) => (
              <div key={i} className="text-center">
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="text-cinema-muted text-xs mt-0.5 flex items-center justify-center gap-1">
                  <s.icon size={12} /> {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Avatar Picker */}
        {editing && (
          <div className="bg-cinema-card border border-cinema-border rounded-2xl p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Choose Avatar</h3>
              <button onClick={() => setEditing(false)} className="text-cinema-muted hover:text-white">
                <FiX size={18} />
              </button>
            </div>
            <div className="grid grid-cols-10 gap-2 mb-4">
              {AVATARS.map(a => (
                <button
                  key={a}
                  onClick={() => setTempAvatar(a)}
                  className={`text-2xl p-2 rounded-xl transition-all ${
                    tempAvatar === a
                      ? 'bg-cinema-accent/20 border-2 border-cinema-accent scale-110'
                      : 'bg-cinema-dark border-2 border-transparent hover:border-cinema-border'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
            <button
              onClick={saveAvatar}
              className="flex items-center gap-2 bg-cinema-accent hover:bg-red-700 text-white px-6 py-2 rounded-xl transition-colors"
            >
              <FiCheck size={16} /> Save Avatar
            </button>
          </div>
        )}

        {/* Continue Watching */}
        {continueWatching.length > 0 && (
          <div className="bg-cinema-card border border-cinema-border rounded-2xl p-5">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <FiClock className="text-cinema-accent" size={18} /> Continue Watching
            </h3>
            <div className="space-y-3">
              {continueWatching.map((item, i) => (
                <div key={i} className="flex items-center gap-3 bg-cinema-dark rounded-xl p-3">
                  <div className="w-16 h-10 rounded-lg overflow-hidden bg-cinema-card shrink-0 relative">
                    {item.poster && <Image src={item.poster} alt="" fill className="object-cover" unoptimized />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-cinema-text text-sm font-medium truncate">{item.showTitle || item.title}</p>
                    {item.type === 'tv' && (
                      <p className="text-cinema-accent text-xs">S{item.season}E{item.episode}</p>
                    )}
                    <div className="mt-1 h-1 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-cinema-accent rounded-full" style={{ width: `${item.percent}%` }} />
                    </div>
                  </div>
                  <span className="text-cinema-muted text-xs shrink-0">{item.percent}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
