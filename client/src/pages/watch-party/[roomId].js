/**
 * Watch Party Page — /watch-party/[roomId]
 * Real-time synced watching with live chat
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { io } from 'socket.io-client';
import { movieApi } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { FiSend, FiUsers, FiLink, FiCheck, FiPlay, FiPause, FiClock, FiArrowLeft } from 'react-icons/fi';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

function formatTime(s) {
  if (!s || isNaN(s)) return '0:00';
  const h   = Math.floor(s / 3600);
  const m   = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  return `${m}:${String(sec).padStart(2,'0')}`;
}

export default function WatchPartyPage() {
  const router        = useRouter();
  const { roomId }    = router.query;
  const { user }      = useAuth();
  const movieId       = router.query.movieId;

  const [movie,       setMovie]       = useState(null);
  const [members,     setMembers]     = useState([]);
  const [messages,    setMessages]    = useState([]);
  const [chatInput,   setChatInput]   = useState('');
  const [isHost,      setIsHost]      = useState(false);
  const [playing,     setPlaying]     = useState(false);
  const [hostTime,    setHostTime]    = useState(0);
  const [syncNotice,  setSyncNotice]  = useState(null);
  const [copied,      setCopied]      = useState(false);
  const [connected,   setConnected]   = useState(false);
  const [activeServer,setActiveServer]= useState(0);
  const [loading,     setLoading]     = useState(true);

  const socketRef      = useRef(null);
  const videoRef       = useRef(null);
  const chatEndRef     = useRef(null);
  const isSyncing      = useRef(false);
  const hostStartRef   = useRef(null);
  const hostOffsetRef  = useRef(0);
  const username       = user?.username || 'Guest';

  // ── Load movie ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!movieId) return;
    movieApi.getById(movieId)
      .then(r => { setMovie(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [movieId]);

  // ── Show sync notice ────────────────────────────────────────────────────
  const showNotice = useCallback((title, body) => {
    setSyncNotice({ title, body });
    setTimeout(() => setSyncNotice(null), 5000);
  }, []);

  // ── Connect socket ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!roomId || !movieId) return;

    const socket = io(API_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join-room', { roomId, movieId, username });
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('room-state', ({ playing, currentTime, hostId, members, myId }) => {
      setIsHost(myId === hostId);
      setMembers(members);
      setPlaying(playing);
      setHostTime(currentTime);
      hostOffsetRef.current = currentTime;
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

    socket.on('host-changed', ({ hostId, members }) => {
      setIsHost(socket.id === hostId);
      setMembers(members);
      if (socket.id === hostId) showNotice('👑 You are now the host', 'You can now control playback');
    });

    socket.on('play', ({ currentTime }) => {
      setPlaying(true);
      setHostTime(currentTime);
      if (videoRef.current) {
        isSyncing.current = true;
        videoRef.current.currentTime = currentTime;
        videoRef.current.play().catch(() => {});
        setTimeout(() => { isSyncing.current = false; }, 500);
      } else {
        showNotice('▶ Host is playing', `Seek to ${formatTime(currentTime)} and press play`);
      }
    });

    socket.on('pause', ({ currentTime }) => {
      setPlaying(false);
      setHostTime(currentTime);
      if (videoRef.current) {
        isSyncing.current = true;
        videoRef.current.currentTime = currentTime;
        videoRef.current.pause();
        setTimeout(() => { isSyncing.current = false; }, 500);
      } else {
        showNotice('⏸ Host paused', `Pause your video at ${formatTime(currentTime)}`);
      }
    });

    socket.on('seek', ({ currentTime }) => {
      setHostTime(currentTime);
      if (videoRef.current) {
        isSyncing.current = true;
        videoRef.current.currentTime = currentTime;
        setTimeout(() => { isSyncing.current = false; }, 500);
      } else {
        showNotice('⏩ Host jumped to', formatTime(currentTime));
      }
    });

    socket.on('time-sync', ({ currentTime }) => {
      setHostTime(currentTime);
      if (!videoRef.current || isSyncing.current) return;
      const drift = Math.abs(videoRef.current.currentTime - currentTime);
      if (drift > 4) {
        isSyncing.current = true;
        videoRef.current.currentTime = currentTime;
        setTimeout(() => { isSyncing.current = false; }, 500);
      }
    });

    socket.on('chat-message', msg => setMessages(m => [...m, msg]));

    return () => { socket.disconnect(); };
  }, [roomId, movieId, username, showNotice]);

  // ── Auto-scroll chat ────────────────────────────────────────────────────
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // ── Host: broadcast time every 5s ───────────────────────────────────────
  useEffect(() => {
    if (!isHost) return;
    const t = setInterval(() => {
      let ct = 0;
      if (videoRef.current) {
        ct = videoRef.current.currentTime;
      } else if (playing && hostStartRef.current) {
        ct = hostOffsetRef.current + (Date.now() - hostStartRef.current) / 1000;
      } else {
        ct = hostOffsetRef.current;
      }
      setHostTime(ct);
      socketRef.current?.emit('time-sync', { roomId, currentTime: ct });
    }, 5000);
    return () => clearInterval(t);
  }, [isHost, roomId, playing]);

  // ── Native video handlers (only host actions emit) ──────────────────────
  const onPlay = useCallback(() => {
    if (isSyncing.current || !isHost) return;
    const ct = videoRef.current?.currentTime || 0;
    setPlaying(true);
    socketRef.current?.emit('play', { roomId, currentTime: ct });
  }, [isHost, roomId]);

  const onPause = useCallback(() => {
    if (isSyncing.current || !isHost) return;
    const ct = videoRef.current?.currentTime || 0;
    setPlaying(false);
    socketRef.current?.emit('pause', { roomId, currentTime: ct });
  }, [isHost, roomId]);

  const onSeeked = useCallback(() => {
    if (isSyncing.current || !isHost) return;
    const ct = videoRef.current?.currentTime || 0;
    socketRef.current?.emit('seek', { roomId, currentTime: ct });
  }, [isHost, roomId]);

  // ── Embed host controls ─────────────────────────────────────────────────
  const embedPlay = () => {
    hostStartRef.current  = Date.now();
    setPlaying(true);
    socketRef.current?.emit('play', { roomId, currentTime: hostOffsetRef.current });
    showNotice('▶ Sent play signal', `Tell guests to seek to ${formatTime(hostOffsetRef.current)}`);
  };

  const embedPause = () => {
    if (hostStartRef.current) {
      hostOffsetRef.current += (Date.now() - hostStartRef.current) / 1000;
      hostStartRef.current = null;
    }
    setPlaying(false);
    socketRef.current?.emit('pause', { roomId, currentTime: hostOffsetRef.current });
    showNotice('⏸ Sent pause signal', `Guests told to pause at ${formatTime(hostOffsetRef.current)}`);
  };

  // ── Chat ────────────────────────────────────────────────────────────────
  const sendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !socketRef.current) return;
    socketRef.current.emit('chat-message', { roomId, username, message: chatInput.trim() });
    setChatInput('');
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // ── Stream sources ──────────────────────────────────────────────────────
  const streamSources = movie?.streamSources?.length > 0
    ? movie.streamSources
    : movie?.streamUrl
      ? [{ url: movie.streamUrl, provider: 'Server 1', isHLS: movie.streamUrl.endsWith('.m3u8') }]
      : [];

  const activeSource = streamSources[activeServer] || streamSources[0];
  const isEmbed      = activeSource && !activeSource.isHLS && !activeSource.url?.includes('archive.org');

  if (loading || !movie) return (
    <div className="min-h-screen flex items-center justify-center bg-cinema-black">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-cinema-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-cinema-muted text-sm">Loading watch party...</p>
      </div>
    </div>
  );

  return (
    <>
      <Head><title>Watch Party — {movie.title} · RoyalQueen</title></Head>

      <div className="h-screen flex flex-col bg-cinema-black overflow-hidden">

        {/* ── Top bar ── */}
        <div className="h-14 bg-cinema-dark border-b border-cinema-border flex items-center justify-between px-4 shrink-0 z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push(`/movie/${movieId}`)} className="text-cinema-muted hover:text-white transition-colors">
              <FiArrowLeft size={18} />
            </button>
            <div className={`w-2 h-2 rounded-full shrink-0 ${connected ? 'bg-green-400' : 'bg-red-400'}`} />
            <span className="text-white font-medium text-sm truncate max-w-xs">{movie.title}</span>
            {isHost && <span className="text-xs bg-cinema-accent text-white px-2 py-0.5 rounded-full shrink-0">Host</span>}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-cinema-muted text-sm">
              <FiUsers size={14} /><span>{members.length}</span>
            </div>
            <button onClick={copyLink}
              className="flex items-center gap-1.5 bg-cinema-card border border-cinema-border hover:border-cinema-accent text-cinema-muted hover:text-white text-xs px-3 py-1.5 rounded-full transition-all">
              {copied ? <FiCheck size={12} className="text-green-400" /> : <FiLink size={12} />}
              {copied ? 'Copied!' : 'Invite'}
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex flex-1 overflow-hidden">

          {/* ── Video ── */}
          <div className="flex-1 flex flex-col bg-black overflow-hidden">
            <div className="flex-1 relative">

              {isEmbed ? (
                <>
                  <iframe
                    key={`${activeSource?.url}-${activeServer}`}
                    src={activeSource?.url}
                    className="absolute inset-0 w-full h-full"
                    allowFullScreen
                    allow="autoplay; fullscreen; encrypted-media"
                    style={{ border: 'none' }}
                  />
                  {/* Sync notice */}
                  {syncNotice && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/95 border border-cinema-accent text-white text-sm px-6 py-3 rounded-2xl z-20 text-center animate-fade-in pointer-events-none">
                      <p className="font-semibold text-cinema-accent">{syncNotice.title}</p>
                      <p className="text-white/80 text-xs mt-1">{syncNotice.body}</p>
                    </div>
                  )}
                  {/* Host embed controls */}
                  {isHost && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/90 rounded-2xl px-5 py-3 border border-white/10 z-10">
                      <FiClock size={13} className="text-cinema-muted" />
                      <span className="text-white text-sm font-mono min-w-[52px]">{formatTime(hostTime)}</span>
                      <div className="w-px h-5 bg-white/20" />
                      <button onClick={embedPlay}
                        className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-all ${playing ? 'bg-white/10 text-white/40' : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'}`}>
                        <FiPlay size={11} /> Play
                      </button>
                      <button onClick={embedPause}
                        className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-all ${!playing ? 'bg-white/10 text-white/40' : 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'}`}>
                        <FiPause size={11} /> Pause
                      </button>
                    </div>
                  )}
                  {/* Guest notice */}
                  {!isHost && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/80 text-cinema-muted text-xs px-4 py-2 rounded-full z-10 pointer-events-none">
                      Waiting for host to signal play/pause
                    </div>
                  )}
                </>
              ) : (
                // Native video — full sync
                <video
                  ref={videoRef}
                  src={activeSource?.url}
                  className="absolute inset-0 w-full h-full"
                  controls={isHost}
                  onPlay={onPlay}
                  onPause={onPause}
                  onSeeked={onSeeked}
                  onTimeUpdate={() => setHostTime(videoRef.current?.currentTime || 0)}
                  onLoadedMetadata={() => {
                    if (hostOffsetRef.current > 2 && videoRef.current) {
                      videoRef.current.currentTime = hostOffsetRef.current;
                    }
                  }}
                />
              )}
            </div>

            {/* Server switcher */}
            {streamSources.length > 1 && (
              <div className="bg-cinema-dark border-t border-cinema-border px-4 py-2 flex items-center gap-2 shrink-0">
                <span className="text-cinema-muted text-xs">Server:</span>
                {streamSources.map((s, i) => (
                  <button key={i} onClick={() => setActiveServer(i)}
                    className={`text-xs px-3 py-1 rounded-full transition-all ${
                      i === activeServer
                        ? 'bg-cinema-accent text-white'
                        : 'bg-cinema-card border border-cinema-border text-cinema-muted hover:border-cinema-accent'
                    }`}>
                    {s.provider || `Server ${i+1}`}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Chat sidebar ── */}
          <div className="w-72 shrink-0 bg-cinema-dark border-l border-cinema-border flex flex-col hidden md:flex">

            {/* Members */}
            <div className="px-4 py-3 border-b border-cinema-border">
              <p className="text-cinema-muted text-xs uppercase tracking-widest mb-2">Watching now</p>
              <div className="flex flex-col gap-1.5 max-h-28 overflow-y-auto">
                {members.map(m => (
                  <div key={m.id} className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-cinema-accent rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {m.username?.[0]?.toUpperCase()}
                    </div>
                    <span className="text-cinema-text text-xs truncate">{m.username}</span>
                    {m.id === socketRef.current?.id && <span className="text-cinema-muted text-xs">(you)</span>}
                    {m.id === members[0]?.id && <span className="text-xs text-cinema-accent ml-auto">host</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
              {messages.length === 0 && (
                <p className="text-cinema-muted text-xs text-center mt-6">No messages yet</p>
              )}
              {messages.map(msg => (
                <div key={msg.id}>
                  {msg.system ? (
                    <p className="text-cinema-muted text-xs text-center italic py-1">{msg.message}</p>
                  ) : (
                    <div className={`flex flex-col ${msg.username === username ? 'items-end' : 'items-start'}`}>
                      <span className="text-cinema-muted text-xs mb-0.5">{msg.username}</span>
                      <div className={`max-w-[90%] rounded-2xl px-3 py-2 text-sm break-words ${
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
                className="flex-1 bg-cinema-card border border-cinema-border rounded-full px-3 py-2 text-xs text-cinema-text placeholder-cinema-muted outline-none focus:border-cinema-accent transition-colors"
              />
              <button type="submit" disabled={!chatInput.trim()}
                className="w-8 h-8 bg-cinema-accent hover:bg-red-700 disabled:opacity-40 rounded-full flex items-center justify-center transition-colors shrink-0">
                <FiSend size={13} className="text-white" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
