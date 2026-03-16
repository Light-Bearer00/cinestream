/**
 * /watch-party/[roomId] — Watch Party Page
 * Real-time synced watching with chat via Socket.io
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Image from 'next/image';
import { io } from 'socket.io-client';
import { movieApi } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { FiSend, FiUsers, FiCopy, FiCheck, FiLink, FiPlay, FiPause, FiClock } from 'react-icons/fi';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

function formatTime(s) {
  if (!s || isNaN(s)) return '0:00';
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  return `${m}:${String(sec).padStart(2,'0')}`;
}

export default function WatchPartyPage() {
  const router          = useRouter();
  const { roomId }      = router.query;
  const { user }        = useAuth();

  const [movie,        setMovie]        = useState(null);
  const [members,      setMembers]      = useState([]);
  const [messages,     setMessages]     = useState([]);
  const [chatInput,    setChatInput]    = useState('');
  const [isHost,       setIsHost]       = useState(false);
  const [playing,      setPlaying]      = useState(false);
  const [currentTime,  setCurrentTime]  = useState(0);
  const [duration,     setDuration]     = useState(0);
  const [copied,       setCopied]       = useState(false);
  const [connected,    setConnected]    = useState(false);
  const [serverBadge,  setServerBadge]  = useState(0);
  const [loading,      setLoading]      = useState(true);
  const [hostTime,     setHostTime]     = useState(0);
  const [syncNotice,   setSyncNotice]   = useState(null);

  const socketRef   = useRef(null);
  const videoRef    = useRef(null);
  const chatEndRef  = useRef(null);
  const isSyncing   = useRef(false); // prevent sync loop

  const username = user?.username || 'Guest';

  // ── Load movie ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!router.query.movieId) return;
    movieApi.getById(router.query.movieId)
      .then(r => { setMovie(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [router.query.movieId]);

  // ── Connect socket ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!roomId || !router.query.movieId) return;

    const socket = io(API_URL, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join-room', {
        roomId,
        movieId:  router.query.movieId,
        username,
      });
    });

    socket.on('disconnect', () => setConnected(false));

    // Initial room state when joining
    socket.on('room-state', ({ playing, currentTime, host, members }) => {
      setHostTime(currentTime);
      setIsHost(socket.id === host);
      setMembers(members);
      setPlaying(playing);
      setCurrentTime(currentTime);
      // Seek video to current room time
      if (videoRef.current && currentTime > 2) {
        isSyncing.current = true;
        videoRef.current.currentTime = currentTime;
        setTimeout(() => { isSyncing.current = false; }, 500);
      }
    });

    socket.on('member-joined', ({ username: u, members }) => {
      setMembers(members);
      setMessages(m => [...m, { id: Date.now(), system: true, message: `${u} joined the party 🎉` }]);
    });

    socket.on('member-left', ({ members }) => setMembers(members));

    socket.on('host-changed', ({ newHost }) => {
      setIsHost(socket.id === newHost);
      setMessages(m => [...m, { id: Date.now(), system: true, message: "You're now the host" }]);
    });

    // Sync events from host
    socket.on('play', ({ currentTime }) => {
      setHostTime(currentTime);
      setPlaying(true);
      setCurrentTime(currentTime);
      if (videoRef.current) {
        // native video — actually control it
        isSyncing.current = true;
        videoRef.current.currentTime = currentTime;
        videoRef.current.play().catch(() => {});
        setTimeout(() => { isSyncing.current = false; }, 500);
      } else {
        // embed — show notice to guest
        setSyncNotice({ title: '▶ Host is playing', body: `Seek to ${formatTime(currentTime)} and press play` });
        setTimeout(() => setSyncNotice(null), 5000);
      }
    });

    socket.on('pause', ({ currentTime }) => {
      setHostTime(currentTime);
      setPlaying(false);
      setCurrentTime(currentTime);
      if (videoRef.current) {
        isSyncing.current = true;
        videoRef.current.currentTime = currentTime;
        videoRef.current.pause();
        setTimeout(() => { isSyncing.current = false; }, 500);
      } else {
        setSyncNotice({ title: '⏸ Host paused', body: `Pause your video at ${formatTime(currentTime)}` });
        setTimeout(() => setSyncNotice(null), 5000);
      }
    });

    socket.on('seek', ({ currentTime }) => {
      setHostTime(currentTime);
      setCurrentTime(currentTime);
      if (videoRef.current) {
        isSyncing.current = true;
        videoRef.current.currentTime = currentTime;
        setTimeout(() => { isSyncing.current = false; }, 500);
      } else {
        setSyncNotice({ title: '⏩ Host seeked', body: `Jump to ${formatTime(currentTime)}` });
        setTimeout(() => setSyncNotice(null), 5000);
      }
    });

    socket.on('time-sync', ({ currentTime: serverTime }) => {
      setHostTime(serverTime);
      if (!videoRef.current) return; // embed — just track host time
      if (isSyncing.current) return;
      const drift = Math.abs(videoRef.current.currentTime - serverTime);
      if (drift > 3) {
        isSyncing.current = true;
        videoRef.current.currentTime = serverTime;
        setTimeout(() => { isSyncing.current = false; }, 500);
      }
    });

    socket.on('chat-message', (msg) => {
      setMessages(m => [...m, msg]);
    });

    return () => socket.disconnect();
  }, [roomId, router.query.movieId, username]);

  // ── Auto scroll chat ────────────────────────────────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Host: broadcast time every 5s ───────────────────────────────────────
  // For native video: uses real currentTime
  // For embeds: tracks elapsed time manually since we can't read iframe time
  const hostStartRef   = useRef(null); // wall clock when play was pressed
  const hostOffsetRef  = useRef(0);    // time at last play press

  useEffect(() => {
    if (!isHost) return;
    const t = setInterval(() => {
      let ct = 0;
      if (videoRef.current) {
        ct = videoRef.current.currentTime;
      } else if (playing && hostStartRef.current !== null) {
        ct = hostOffsetRef.current + (Date.now() - hostStartRef.current) / 1000;
      } else {
        ct = hostOffsetRef.current;
      }
      setHostTime(ct);
      socketRef.current?.emit('time-sync', { roomId, currentTime: ct });
    }, 5000);
    return () => clearInterval(t);
  }, [isHost, roomId, playing]);

  // ── Video event handlers ────────────────────────────────────────────────
  const handlePlay = useCallback(() => {
    if (isSyncing.current || !isHost) return;
    const ct = videoRef.current?.currentTime || 0;
    setPlaying(true);
    socketRef.current?.emit('play', { roomId, currentTime: ct });
  }, [isHost, roomId]);

  const handlePause = useCallback(() => {
    if (isSyncing.current || !isHost) return;
    const ct = videoRef.current?.currentTime || 0;
    setPlaying(false);
    socketRef.current?.emit('pause', { roomId, currentTime: ct });
  }, [isHost, roomId]);

  const handleSeeked = useCallback(() => {
    if (isSyncing.current || !isHost) return;
    const ct = videoRef.current?.currentTime || 0;
    socketRef.current?.emit('seek', { roomId, currentTime: ct });
  }, [isHost, roomId]);

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
  }, []);

  // ── Send chat ───────────────────────────────────────────────────────────
  const sendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !socketRef.current) return;
    socketRef.current.emit('chat-message', { roomId, username, message: chatInput.trim() });
    setChatInput('');
  };

  // ── Copy link ───────────────────────────────────────────────────────────
  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Stream sources ──────────────────────────────────────────────────────
  const streamSources = movie?.streamSources?.length > 0
    ? movie.streamSources
    : movie?.streamUrl ? [{ url: movie.streamUrl, provider: 'direct', isHLS: movie.streamUrl.endsWith('.m3u8') }]
    : [];

  const activeSource  = streamSources[serverBadge] || streamSources[0];
  const isEmbed       = activeSource && !activeSource.isHLS && !activeSource.url?.includes('archive.org');

  // Show a timed sync notice overlay
  const showNotice = (title, body) => {
    setSyncNotice({ title, body });
    setTimeout(() => setSyncNotice(null), 4000);
  };

  // Host emit helpers for embed
  const emitPlay = () => {
    const ct = hostTime;
    hostStartRef.current  = Date.now();
    hostOffsetRef.current = ct;
    setPlaying(true);
    socketRef.current?.emit('play', { roomId, currentTime: ct });
    showNotice('▶ Playing', `Seek to ${formatTime(ct)} and press play`);
  };

  const emitPause = () => {
    // Freeze offset at current estimated time
    if (hostStartRef.current !== null) {
      hostOffsetRef.current = hostOffsetRef.current + (Date.now() - hostStartRef.current) / 1000;
      hostStartRef.current  = null;
    }
    setPlaying(false);
    socketRef.current?.emit('pause', { roomId, currentTime: hostTime });
    showNotice('⏸ Paused', `Host paused at ${formatTime(hostTime)}`);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-cinema-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-cinema-muted">Loading watch party...</p>
      </div>
    </div>
  );

  return (
    <>
      <Head>
        <title>{movie?.title ? `Watch Party — ${movie.title}` : 'Watch Party'} · RoyalQueen</title>
      </Head>

      <div className="min-h-screen bg-cinema-black flex flex-col">

        {/* ── Top bar ── */}
        <div className="h-14 bg-cinema-dark border-b border-cinema-border flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`} />
            <span className="text-white font-medium text-sm">
              {movie?.title || 'Watch Party'}
            </span>
            {isHost && (
              <span className="text-xs bg-cinema-accent text-white px-2 py-0.5 rounded-full">Host</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-cinema-muted text-sm">
              <FiUsers size={14} />
              <span>{members.length}</span>
            </div>
            <button
              onClick={copyLink}
              className="flex items-center gap-1.5 bg-cinema-card border border-cinema-border hover:border-cinema-accent text-cinema-muted hover:text-white text-xs px-3 py-1.5 rounded-full transition-all"
            >
              {copied ? <FiCheck size={13} className="text-green-400" /> : <FiLink size={13} />}
              {copied ? 'Copied!' : 'Share link'}
            </button>
          </div>
        </div>

        {/* ── Main layout ── */}
        <div className="flex flex-1 overflow-hidden">

          {/* ── Video panel ── */}
          <div className="flex-1 flex flex-col bg-black">

            {/* Video / Embed */}
            <div className="flex-1 relative">
              {isEmbed ? (
                <>
                  <iframe
                    key={activeSource?.url}
                    src={activeSource?.url}
                    className="w-full h-full"
                    allowFullScreen
                    allow="autoplay; fullscreen"
                    style={{ border: 'none', minHeight: '400px' }}
                  />

                  {/* Sync overlay — shown to ALL users */}
                  {syncNotice && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/90 border border-cinema-accent text-white text-sm px-5 py-3 rounded-2xl z-20 animate-fade-in text-center">
                      <p className="font-semibold text-cinema-accent mb-1">{syncNotice.title}</p>
                      <p className="text-white/80">{syncNotice.body}</p>
                    </div>
                  )}

                  {/* Host control bar */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/90 backdrop-blur rounded-full px-5 py-2.5 border border-white/10 z-10">
                    <FiClock size={14} className="text-cinema-muted" />
                    <span className="text-white text-sm font-mono">{formatTime(hostTime)}</span>
                    {isHost && (
                      <>
                        <div className="w-px h-4 bg-white/20" />
                        <button
                          onClick={() => emitPlay()}
                          className="flex items-center gap-1.5 text-green-400 text-xs hover:text-green-300 transition-colors"
                        >
                          <FiPlay size={12} /> Tell guests to play
                        </button>
                        <button
                          onClick={() => emitPause()}
                          className="flex items-center gap-1.5 text-yellow-400 text-xs hover:text-yellow-300 transition-colors"
                        >
                          <FiPause size={12} /> Pause
                        </button>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <video
                  ref={videoRef}
                  src={activeSource?.url}
                  className="w-full h-full"
                  controls={isHost}
                  onPlay={handlePlay}
                  onPause={handlePause}
                  onSeeked={handleSeeked}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
                  style={{ minHeight: '400px' }}
                />
              )}
            </div>

            {/* Server switcher */}
            {streamSources.length > 1 && (
              <div className="bg-cinema-dark border-t border-cinema-border px-4 py-2 flex items-center gap-2 shrink-0">
                <span className="text-cinema-muted text-xs">Server:</span>
                {streamSources.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setServerBadge(i)}
                    className={`text-xs px-3 py-1 rounded-full transition-all ${
                      i === serverBadge
                        ? 'bg-cinema-accent text-white'
                        : 'bg-cinema-card border border-cinema-border text-cinema-muted hover:border-cinema-accent'
                    }`}
                  >
                    {s.provider || `Server ${i + 1}`}
                  </button>
                ))}
              </div>
            )}

            {/* Guest notice for native video */}
            {!isHost && !isEmbed && (
              <div className="bg-cinema-dark border-t border-cinema-border px-4 py-2 text-center shrink-0">
                <p className="text-cinema-muted text-xs">
                  You're a guest — playback is synced automatically by the host
                </p>
              </div>
            )}
          </div>

          {/* ── Chat sidebar ── */}
          <div className="w-80 shrink-0 bg-cinema-dark border-l border-cinema-border flex flex-col hidden md:flex">

            {/* Members */}
            <div className="px-4 py-3 border-b border-cinema-border">
              <p className="text-cinema-muted text-xs uppercase tracking-widest mb-2">Watching now</p>
              <div className="flex flex-wrap gap-2">
                {members.map((m) => (
                  <div key={m.id} className="flex items-center gap-1.5 bg-cinema-card rounded-full px-2.5 py-1">
                    <div className="w-5 h-5 bg-cinema-accent rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {m.username?.[0]?.toUpperCase()}
                    </div>
                    <span className="text-cinema-text text-xs">{m.username}</span>
                    {m.id === socketRef.current?.id && (
                      <span className="text-cinema-muted text-xs">(you)</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {messages.length === 0 && (
                <p className="text-cinema-muted text-xs text-center mt-8">
                  No messages yet — say hi!
                </p>
              )}
              {messages.map((msg) => (
                <div key={msg.id}>
                  {msg.system ? (
                    <p className="text-cinema-muted text-xs text-center italic">{msg.message}</p>
                  ) : (
                    <div className={`flex flex-col ${msg.username === username ? 'items-end' : 'items-start'}`}>
                      <span className="text-cinema-muted text-xs mb-0.5">{msg.username}</span>
                      <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                        msg.username === username
                          ? 'bg-cinema-accent text-white rounded-tr-sm'
                          : 'bg-cinema-card text-cinema-text rounded-tl-sm'
                      }`}>
                        {msg.message}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Chat input */}
            <form onSubmit={sendChat} className="px-3 py-3 border-t border-cinema-border flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                placeholder="Say something..."
                maxLength={200}
                className="flex-1 bg-cinema-card border border-cinema-border rounded-full px-3 py-2 text-sm text-cinema-text placeholder-cinema-muted outline-none focus:border-cinema-accent transition-colors"
              />
              <button
                type="submit"
                disabled={!chatInput.trim()}
                className="w-9 h-9 bg-cinema-accent hover:bg-red-700 disabled:opacity-40 rounded-full flex items-center justify-center transition-colors shrink-0"
              >
                <FiSend size={14} className="text-white" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
