/**
 * VideoPlayer
 * - Direct MP4/WebM  → native <video> with custom controls
 * - HLS .m3u8        → hls.js + native <video>
 * - Embed URLs       → <iframe> (Streamtape, Doodstream, Filemoon, etc.)
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  FiPlay, FiPause, FiVolume2, FiVolumeX,
  FiMaximize, FiMinimize, FiSettings, FiLoader
} from 'react-icons/fi';

/** Returns true if the URL should be shown in an iframe */
function isEmbedUrl(url) {
  if (!url) return false;
  return (
    url.includes('streamtape.com') ||
    url.includes('dood.ws') ||
    url.includes('doodstream.com') ||
    url.includes('filemoon.sx') ||
    url.includes('mixdrop.co') ||
    url.includes('mp4upload.com') ||
    url.includes('upcloud.') ||
    url.includes('vidstream.') ||
    url.includes('autoembed.co') ||
    url.includes('vidsrc.xyz') ||
    url.includes('vidsrc.to') ||
    url.includes('vidsrc.me') ||
    url.includes('embed.su') ||
    url.includes('2embed.cc') ||
    url.includes('moviesapi.club') ||
    url.includes('embedrise.com') ||
    url.includes('multiembed.mov') ||
    url.includes('NontonFilm')
  );
}

export default function VideoPlayer({ streamUrl, streamSources = [], title }) {
  const videoRef      = useRef(null);
  const containerRef  = useRef(null);
  const hlsRef        = useRef(null);
  const timerRef      = useRef(null);

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
  const [error,        setError]        = useState(null);

  const activeUrl = selectedSrc?.url || streamUrl || '';
  const useEmbed  = isEmbedUrl(activeUrl);
  const isHLS     = !useEmbed && (selectedSrc?.isHLS || activeUrl.endsWith('.m3u8'));

  // ── Load video source ──────────────────────────────────────────────────────
  const loadSource = useCallback(async (url, hls) => {
    const video = videoRef.current;
    if (!video || !url) return;
    setError(null); setIsBuffering(true);
    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }

    if (hls) {
      try {
        const Hls = (await import('hls.js')).default;
        if (Hls.isSupported()) {
          const h = new Hls({ enableWorker: true });
          h.loadSource(url);
          h.attachMedia(video);
          h.on(Hls.Events.MANIFEST_PARSED, () => setIsBuffering(false));
          h.on(Hls.Events.ERROR, (_, d) => { if (d.fatal) setError('HLS stream error.'); });
          hlsRef.current = h;
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = url;
        }
      } catch { setError('Failed to load HLS.'); }
    } else {
      video.src = url;
    }
  }, []);

  useEffect(() => {
    if (!useEmbed) loadSource(activeUrl, isHLS);
  }, [activeUrl, isHLS, useEmbed, loadSource]);

  useEffect(() => () => { if (hlsRef.current) hlsRef.current.destroy(); }, []);

  // ── Controls ───────────────────────────────────────────────────────────────
  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    v.paused ? v.play().catch(() => {}) : v.pause();
  };

  const handleSeek = (e) => {
    const v = videoRef.current;
    if (!v || !duration) return;
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

  // Auto-hide controls after 3s
  const resetTimer = () => {
    setShowControls(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => { if (isPlaying) setShowControls(false); }, 3000);
  };

  // Keyboard shortcuts
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
    return `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;
  };

  const progress = duration ? (currentTime / duration) * 100 : 0;

  // ── Embed iframe player ────────────────────────────────────────────────────
  if (useEmbed) {
    return (
      <div ref={containerRef} className="relative w-full aspect-video rounded-xl overflow-hidden bg-black">
        <iframe
          src={activeUrl}
          className="w-full h-full"
          frameBorder="0"
          allowFullScreen
          scrolling="no"
          allow="autoplay; fullscreen; picture-in-picture"
          title={title}
        />
        {/* Quality switcher for embed sources */}
        {streamSources.length > 1 && (
          <div className="absolute top-3 right-3">
            <div className="relative">
              <button
                onClick={() => setShowQuality(!showQuality)}
                className="bg-black/70 text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-black transition-colors"
              >
                <FiSettings size={12} /> Source
              </button>
              {showQuality && (
                <div className="absolute top-8 right-0 bg-cinema-card border border-cinema-border rounded-xl overflow-hidden shadow-xl w-44 z-20">
                  {streamSources.map((s, i) => (
                    <button key={i} onClick={() => { setSelectedSrc(s); setShowQuality(false); }}
                      className={`w-full text-left px-3 py-2 text-xs hover:bg-cinema-border transition-colors ${selectedSrc?.url === s.url ? 'text-cinema-accent' : 'text-cinema-text'}`}>
                      {s.quality} · {s.provider}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Native HTML5 player ────────────────────────────────────────────────────
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
          if (v.buffered.length) setBuffered((v.buffered.end(v.buffered.length-1)/v.duration)*100);
        }}
        onLoadedMetadata={() => { setDuration(videoRef.current?.duration||0); setIsBuffering(false); }}
        onWaiting={()  => setIsBuffering(true)}
        onPlaying={() => setIsBuffering(false)}
        onPlay={()    => setIsPlaying(true)}
        onPause={()   => setIsPlaying(false)}
        onError={()   => setError('Could not load video. Check the stream URL.')}
        playsInline
      />

      {/* Buffering */}
      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <FiLoader className="text-white text-4xl animate-spin" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 gap-3">
          <p className="text-red-400 text-center px-6 text-sm">{error}</p>
          <button onClick={e => { e.stopPropagation(); loadSource(activeUrl, isHLS); }}
            className="bg-cinema-accent text-white px-5 py-2 rounded-lg text-sm hover:bg-red-700 transition-colors">
            Retry
          </button>
        </div>
      )}

      {/* Big center play button */}
      {!isPlaying && !isBuffering && !error && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-20 h-20 bg-cinema-accent/90 rounded-full flex items-center justify-center shadow-2xl">
            <FiPlay size={34} className="text-white ml-1.5" />
          </div>
        </div>
      )}

      {/* Controls overlay */}
      <div
        className={`absolute bottom-0 left-0 right-0 px-4 pb-3 pt-10 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)' }}
        onClick={e => e.stopPropagation()}
      >
        <p className="text-white/70 text-xs mb-2 truncate">{title}</p>

        {/* Seek bar */}
        <div className="relative h-1 bg-white/20 rounded-full cursor-pointer mb-3 group/s" onClick={handleSeek}>
          <div className="absolute h-full bg-white/30 rounded-full" style={{width:`${buffered}%`}} />
          <div className="absolute h-full bg-cinema-accent rounded-full" style={{width:`${progress}%`}} />
          <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover/s:opacity-100 transition-opacity"
            style={{left:`calc(${progress}% - 6px)`}} />
        </div>

        <div className="flex items-center justify-between gap-3">
          {/* Left */}
          <div className="flex items-center gap-3">
            <button onClick={togglePlay} className="text-white hover:text-cinema-accent transition-colors">
              {isPlaying ? <FiPause size={21}/> : <FiPlay size={21}/>}
            </button>
            <div className="flex items-center gap-2 group/v">
              <button onClick={toggleMute} className="text-white hover:text-cinema-accent transition-colors">
                {isMuted||volume===0 ? <FiVolumeX size={18}/> : <FiVolume2 size={18}/>}
              </button>
              <div className="w-0 overflow-hidden group-hover/v:w-20 transition-all duration-300">
                <input type="range" min="0" max="1" step="0.05"
                  value={isMuted?0:volume} onChange={handleVolume}
                  className="w-20"
                  style={{background:`linear-gradient(to right,#e50914 ${(isMuted?0:volume)*100}%,rgba(255,255,255,.3) ${(isMuted?0:volume)*100}%)`}}
                />
              </div>
            </div>
            <span className="text-white/70 text-xs tabular-nums">{fmt(currentTime)} / {fmt(duration)}</span>
          </div>

          {/* Right */}
          <div className="flex items-center gap-3">
            {streamSources.length > 1 && (
              <div className="relative">
                <button onClick={() => setShowQuality(!showQuality)}
                  className="text-white/70 hover:text-white transition-colors"><FiSettings size={15}/></button>
                {showQuality && (
                  <div className="absolute bottom-8 right-0 bg-cinema-card border border-cinema-border rounded-xl overflow-hidden shadow-xl w-36 z-20">
                    <p className="text-cinema-muted text-xs px-3 py-2 border-b border-cinema-border">Quality</p>
                    {streamSources.map((s,i) => (
                      <button key={i} onClick={() => { setSelectedSrc(s); setShowQuality(false); }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-cinema-border transition-colors ${selectedSrc?.url===s.url?'text-cinema-accent':'text-cinema-text'}`}>
                        {s.quality} · {s.provider}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            <button onClick={toggleFullscreen} className="text-white/70 hover:text-white transition-colors">
              {isFullscreen ? <FiMinimize size={17}/> : <FiMaximize size={17}/>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
