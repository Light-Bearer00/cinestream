/**
 * VideoPlayer
 * - Embed URLs (vidsrc, streamtape, dood etc.) → <iframe>
 * - Direct MP4/WebM → native <video> with custom controls
 * - HLS .m3u8 → hls.js + native <video>
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  FiPlay, FiPause, FiVolume2, FiVolumeX,
  FiMaximize, FiMinimize, FiSettings, FiLoader,
  FiExternalLink
} from 'react-icons/fi';

/**
 * Detect if URL should be played in iframe vs native video tag.
 * vidsrc.to and similar sites MUST use iframe — they don't serve raw video files.
 */
function getUrlType(url) {
  if (!url) return 'unknown';

  // ── Embed providers (MUST use iframe) ──
  if (
    url.includes('vidsrc.to')        ||
    url.includes('vidsrc.me')        ||
    url.includes('vidsrc.net')       ||
    url.includes('vidsrc.in')        ||
    url.includes('vidsrc.pm')        ||
    url.includes('vidsrc.xyz')       ||
    url.includes('vidsrc.cc')        ||
    url.includes('vidstream')        ||
    url.includes('streamtape.com')   ||
    url.includes('dood.ws')          ||
    url.includes('dood.la')          ||
    url.includes('doodstream.com')   ||
    url.includes('filemoon.sx')      ||
    url.includes('filemoon.to')      ||
    url.includes('mixdrop.co')       ||
    url.includes('mixdrop.to')       ||
    url.includes('mp4upload.com')    ||
    url.includes('upcloud.')         ||
    url.includes('embedsito')        ||
    url.includes('embed.su')         ||
    url.includes('multiembed')       ||
    url.includes('2embed')           ||
    url.includes('smashystream')     ||
    url.includes('autoembed')        ||
    url.includes('moviesapi')        ||
    url.includes('embedrise')        ||
    url.includes('embedder')         ||
    url.includes('/embed/')          // catch-all for any /embed/ URL
  ) return 'embed';

  // ── HLS stream ──
  if (url.endsWith('.m3u8') || url.includes('.m3u8?')) return 'hls';

  // ── Direct video file ──
  if (
    url.endsWith('.mp4')  || url.includes('.mp4?')  ||
    url.endsWith('.webm') || url.includes('.webm?') ||
    url.endsWith('.mkv')  ||
    url.includes('archive.org')
  ) return 'mp4';

  // Default — try as embed iframe (safer than crashing native player)
  return 'embed';
}

function getProviderName(url) {
  if (url.includes('vidsrc.to'))    return 'VidSrc';
  if (url.includes('vidsrc.me'))    return 'VidSrc';
  if (url.includes('streamtape'))   return 'Streamtape';
  if (url.includes('dood'))         return 'Doodstream';
  if (url.includes('filemoon'))     return 'Filemoon';
  if (url.includes('mixdrop'))      return 'Mixdrop';
  if (url.includes('mp4upload'))    return 'MP4Upload';
  if (url.includes('archive.org'))  return 'Internet Archive';
  return 'External';
}

export default function VideoPlayer({ streamUrl, streamSources = [], title }) {
  const videoRef     = useRef(null);
  const containerRef = useRef(null);
  const hlsRef       = useRef(null);
  const timerRef     = useRef(null);

  const [isPlaying,    setIsPlaying]    = useState(false);
  const [isMuted,      setIsMuted]      = useState(false);
  const [volume,       setVolume]       = useState(1);
  const [currentTime,  setCurrentTime]  = useState(0);
  const [duration,     setDuration]     = useState(0);
  const [buffered,     setBuffered]     = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isBuffering,  setIsBuffering]  = useState(false);
  const [selectedSrc,  setSelectedSrc]  = useState(null);
  const [showQuality,  setShowQuality]  = useState(false);
  const [iframeError,  setIframeError]  = useState(false);

  const activeUrl  = selectedSrc?.url || streamUrl || '';
  const urlType    = getUrlType(activeUrl);
  const isEmbed    = urlType === 'embed';
  const isHLS      = urlType === 'hls';
  const provider   = getProviderName(activeUrl);

  // ── Load native video source ──────────────────────────────────────────────
  const loadSource = useCallback(async (url, hls) => {
    const video = videoRef.current;
    if (!video || !url) return;
    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }

    if (hls) {
      try {
        const Hls = (await import('hls.js')).default;
        if (Hls.isSupported()) {
          const h = new Hls({ enableWorker: true });
          h.loadSource(url);
          h.attachMedia(video);
          hlsRef.current = h;
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = url;
        }
      } catch { console.error('HLS load failed'); }
    } else {
      video.src = url;
    }
  }, []);

  useEffect(() => {
    if (!isEmbed) loadSource(activeUrl, isHLS);
  }, [activeUrl, isHLS, isEmbed, loadSource]);

  useEffect(() => () => { if (hlsRef.current) hlsRef.current.destroy(); }, []);

  // ── Native video controls ─────────────────────────────────────────────────
  const togglePlay = () => {
    const v = videoRef.current; if (!v) return;
    v.paused ? v.play().catch(() => {}) : v.pause();
  };

  const handleSeek = (e) => {
    const v = videoRef.current; if (!v || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    v.currentTime = ((e.clientX - rect.left) / rect.width) * duration;
  };

  const handleVolume = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val); setIsMuted(val === 0);
    if (videoRef.current) videoRef.current.volume = val;
  };

  const toggleMute = () => {
    const v = videoRef.current; if (!v) return;
    v.muted = !v.muted; setIsMuted(v.muted);
  };

  const toggleFullscreen = () => {
    const c = containerRef.current; if (!c) return;
    document.fullscreenElement ? document.exitFullscreen() : c.requestFullscreen?.();
  };

  useEffect(() => {
    const h = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', h);
    return () => document.removeEventListener('fullscreenchange', h);
  }, []);

  const resetTimer = () => {
    setShowControls(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => { if (isPlaying) setShowControls(false); }, 3000);
  };

  useEffect(() => {
    const h = (e) => {
      if (e.target.tagName === 'INPUT') return;
      if (e.key === ' ' || e.key === 'k') { e.preventDefault(); togglePlay(); }
      if (e.key === 'f') toggleFullscreen();
      if (e.key === 'm') toggleMute();
      if (e.key === 'ArrowRight' && videoRef.current) videoRef.current.currentTime += 10;
      if (e.key === 'ArrowLeft'  && videoRef.current) videoRef.current.currentTime -= 10;
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [isPlaying]);

  const fmt = (s) => {
    if (!s || isNaN(s)) return '0:00';
    return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  };

  const progress = duration ? (currentTime / duration) * 100 : 0;

  // ── Source selector (for multiple stream sources) ─────────────────────────
  const SourceSelector = () => (
    streamSources.length > 1 && (
      <div className="relative">
        <button onClick={() => setShowQuality(!showQuality)}
          className="flex items-center gap-1.5 bg-black/60 hover:bg-black/80 text-white text-xs px-3 py-1.5 rounded-lg transition-colors">
          <FiSettings size={12}/> Source
        </button>
        {showQuality && (
          <div className="absolute top-9 right-0 bg-cinema-card border border-cinema-border rounded-xl overflow-hidden shadow-2xl w-48 z-30">
            <p className="text-cinema-muted text-xs px-3 py-2 border-b border-cinema-border font-medium">
              Choose Source
            </p>
            {streamSources.map((s, i) => (
              <button key={i}
                onClick={() => { setSelectedSrc(s); setShowQuality(false); setIframeError(false); }}
                className={`w-full text-left px-3 py-2.5 text-xs hover:bg-cinema-border transition-colors flex items-center justify-between ${
                  selectedSrc?.url === s.url ? 'text-cinema-accent' : 'text-cinema-text'
                }`}>
                <span>{s.provider || `Source ${i + 1}`}</span>
                <span className="text-cinema-muted">{s.quality}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    )
  );

  // ── IFRAME PLAYER (vidsrc, streamtape, dood, etc.) ────────────────────────
  if (isEmbed) {

    // ── COMPREHENSIVE AD & REDIRECT BLOCKER ─────────────────────────────────
    useEffect(() => {
      if (!isEmbed) return;

      // Known streaming domains — everything else is blocked
      const ALLOWED_DOMAINS = [
        'autoembed.co', 'vidsrc.xyz', 'vidsrc.me', 'vidsrc.net',
        'embed.su', 'moviesapi.club', '2embed.cc', '2embed.org',
        'embedrise.com', 'filemoon.sx', 'streamtape.com',
        'doodstream.com', 'dood.la', 'dood.ws', 'mixdrop.co',
        'mp4upload.com', 'upcloud.', 'smashystream.com',
        'multiembed.mov', 'autoembed.to', window.location.hostname,
      ];

      const isAllowed = (url = '') => {
        try {
          const host = new URL(url).hostname;
          return ALLOWED_DOMAINS.some(d => host.includes(d));
        } catch { return false; }
      };

      // 1. Block ALL window.open — no popups ever
      const originalOpen = window.open;
      window.open = () => null;

      // 2. Block location changes (redirects away from our site)
      const originalAssign   = window.location.assign.bind(window.location);
      const originalReplace  = window.location.replace.bind(window.location);
      try {
        Object.defineProperty(window, 'location', {
          configurable: true,
          get: () => new Proxy(window.location, {
            set(target, prop, value) {
              if (prop === 'href') return true; // block redirect
              target[prop] = value;
              return true;
            }
          })
        });
      } catch(e) {}

      // 3. Intercept any <a> clicks trying to go to ad sites
      const blockAdClicks = (e) => {
        const el = e.target.closest('a');
        if (!el) return;
        const href = el.href || '';
        if (href && !isAllowed(href) && !href.startsWith(window.location.origin)) {
          e.preventDefault();
          e.stopImmediatePropagation();
        }
      };
      document.addEventListener('click', blockAdClicks, true);

      // 4. Block blur (tab switching from popup)
      const handleBlur = () => {
        setTimeout(() => window.focus(), 50);
      };
      window.addEventListener('blur', handleBlur);

      // 5. MutationObserver — remove any injected ad iframes/scripts
      const observer = new MutationObserver((mutations) => {
        mutations.forEach(m => {
          m.addedNodes.forEach(node => {
            if (node.nodeType !== 1) return;
            const tag = node.tagName?.toLowerCase();
            // Remove injected iframes that aren't our player
            if (tag === 'iframe') {
              const src = node.src || '';
              if (src && !isAllowed(src)) node.remove();
            }
            // Remove injected scripts from ad networks
            if (tag === 'script') {
              const src = node.src || '';
              if (src && !isAllowed(src)) node.remove();
            }
          });
        });
      });
      observer.observe(document.body, { childList: true, subtree: true });

      return () => {
        window.open = originalOpen;
        window.removeEventListener('blur', handleBlur);
        document.removeEventListener('click', blockAdClicks, true);
        observer.disconnect();
      };
    }, [isEmbed]);

    return (
      <>
      <div ref={containerRef} className="relative w-full aspect-video rounded-xl overflow-hidden bg-black group">

        {!iframeError ? (
          <>


            <iframe
              key={activeUrl}
              src={activeUrl}
              className="w-full h-full border-0"
              allowFullScreen
              allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
              referrerPolicy="origin"
              scrolling="no"
              title={title}
              
              onError={() => setIframeError(true)}
            />

            {/* Top bar */}
            <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-3 py-2 bg-gradient-to-b from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
              <div className="flex items-center gap-2">
                <span className="text-white text-xs bg-cinema-accent px-2 py-0.5 rounded font-medium">
                  {provider}
                </span>
                <span className="text-white/60 text-xs truncate max-w-xs">{title}</span>
                <span className="text-green-400 text-xs bg-green-400/10 border border-green-400/30 px-2 py-0.5 rounded">
                  🛡️ Ad Protection ON
                </span>
              </div>
              <div className="flex items-center gap-2">
                <SourceSelector />
                <a href={activeUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 bg-black/60 hover:bg-black/80 text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
                  title="Open in new tab if player doesn't load">
                  <FiExternalLink size={12}/> Open
                </a>
              </div>
            </div>
          </>
        ) : (
          /* Iframe failed to load */
          <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-cinema-dark">
            <p className="text-5xl">📡</p>
            <p className="text-white font-semibold">Stream blocked by provider</p>
            <p className="text-cinema-muted text-sm text-center px-8">
              {provider} is blocking the embed. Try opening it directly or switch to another source.
            </p>
            <div className="flex gap-3 flex-wrap justify-center">
              <a href={activeUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 bg-cinema-accent hover:bg-red-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors">
                <FiExternalLink size={14}/> Open in New Tab
              </a>
              {streamSources.length > 1 && (
                <button onClick={() => setShowQuality(true)}
                  className="flex items-center gap-2 border border-cinema-border text-cinema-muted hover:border-cinema-accent hover:text-cinema-accent px-5 py-2.5 rounded-xl text-sm transition-colors">
                  <FiSettings size={14}/> Try Another Source
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Server switcher — OUTSIDE the player, below it */}
      {streamSources.length > 1 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {streamSources.map((s, i) => (
            <button key={i}
              onClick={() => { setSelectedSrc(s); setIframeError(false); }}
              className={`text-xs px-4 py-2 rounded-xl font-medium transition-all border ${
                selectedSrc?.url === s.url
                  ? 'bg-cinema-accent border-cinema-accent text-white'
                  : 'bg-cinema-card border-cinema-border text-cinema-muted hover:border-cinema-accent hover:text-white'
              }`}>
              {s.label || `Server ${i + 1}`}
            </button>
          ))}
          <a href={activeUrl} target="_blank" rel="noopener noreferrer"
            className="ml-auto flex items-center gap-1 bg-cinema-card border border-cinema-border text-cinema-muted hover:border-cinema-accent hover:text-white text-xs px-4 py-2 rounded-xl transition-colors">
            <FiExternalLink size={12}/> Open
          </a>
        </div>
      )}
    </>
    );
  }

  // ── NATIVE VIDEO PLAYER (MP4 / HLS) ──────────────────────────────────────
  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-video rounded-xl overflow-hidden bg-black select-none"
      onMouseMove={resetTimer}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      onClick={togglePlay}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        onTimeUpdate={() => {
          const v = videoRef.current; if (!v) return;
          setCurrentTime(v.currentTime);
          if (v.buffered.length) setBuffered((v.buffered.end(v.buffered.length - 1) / v.duration) * 100);
        }}
        onLoadedMetadata={() => { setDuration(videoRef.current?.duration || 0); setIsBuffering(false); }}
        onWaiting={()  => setIsBuffering(true)}
        onPlaying={() => setIsBuffering(false)}
        onPlay={()    => setIsPlaying(true)}
        onPause={()   => setIsPlaying(false)}
        onError={()   => setIsBuffering(false)}
        playsInline
      />

      {/* Buffering spinner */}
      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <FiLoader className="text-white text-4xl animate-spin" />
        </div>
      )}

      {/* Big play button */}
      {!isPlaying && !isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-20 h-20 bg-cinema-accent/90 rounded-full flex items-center justify-center shadow-2xl">
            <FiPlay size={34} className="text-white ml-1.5" />
          </div>
        </div>
      )}

      {/* Controls */}
      <div
        className={`absolute bottom-0 left-0 right-0 px-4 pb-3 pt-10 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)' }}
        onClick={e => e.stopPropagation()}
      >
        <p className="text-white/60 text-xs mb-2 truncate">{title}</p>

        {/* Seek bar */}
        <div className="relative h-1 bg-white/20 rounded-full cursor-pointer mb-3 group/s" onClick={handleSeek}>
          <div className="absolute h-full bg-white/30 rounded-full" style={{ width: `${buffered}%` }} />
          <div className="absolute h-full bg-cinema-accent rounded-full" style={{ width: `${progress}%` }} />
          <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover/s:opacity-100 transition-opacity"
            style={{ left: `calc(${progress}% - 6px)` }} />
        </div>

        <div className="flex items-center justify-between gap-3">
          {/* Left */}
          <div className="flex items-center gap-3">
            <button onClick={togglePlay} className="text-white hover:text-cinema-accent transition-colors">
              {isPlaying ? <FiPause size={21} /> : <FiPlay size={21} />}
            </button>
            <div className="flex items-center gap-2 group/v">
              <button onClick={toggleMute} className="text-white hover:text-cinema-accent transition-colors">
                {isMuted || volume === 0 ? <FiVolumeX size={18} /> : <FiVolume2 size={18} />}
              </button>
              <div className="w-0 overflow-hidden group-hover/v:w-20 transition-all duration-300">
                <input type="range" min="0" max="1" step="0.05"
                  value={isMuted ? 0 : volume} onChange={handleVolume}
                  className="w-20"
                  style={{ background: `linear-gradient(to right,#e50914 ${(isMuted ? 0 : volume) * 100}%,rgba(255,255,255,.3) ${(isMuted ? 0 : volume) * 100}%)` }} />
              </div>
            </div>
            <span className="text-white/60 text-xs tabular-nums">{fmt(currentTime)} / {fmt(duration)}</span>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">
            <SourceSelector />
            <button onClick={toggleFullscreen} className="text-white/70 hover:text-white transition-colors">
              {isFullscreen ? <FiMinimize size={17} /> : <FiMaximize size={17} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
