/**
 * Admin Panel
 * - Auto-fetch movie info (poster, description, rating, cast) from just a title
 * - Add single movie
 * - Bulk import: URL list or JSON
 * - Edit / Delete
 */

import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import { adminApi } from '../../utils/api';
import {
  FiPlus, FiEdit2, FiTrash2, FiX, FiSave, FiEye,
  FiUpload, FiLink, FiChevronDown, FiChevronUp,
  FiSearch, FiCheck, FiList, FiRefreshCw, FiZap
} from 'react-icons/fi';
import { MdLocalMovies } from 'react-icons/md';

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function detectStreamType(url) {
  if (!url) return { type: 'unknown', label: '' };
  if (url.endsWith('.m3u8'))                               return { type: 'hls',   label: 'HLS Stream' };
  if (url.endsWith('.mp4') || url.endsWith('.webm'))       return { type: 'mp4',   label: 'Direct MP4' };
  if (url.includes('streamtape.com'))                      return { type: 'embed', label: 'Streamtape' };
  if (url.includes('dood'))                                return { type: 'embed', label: 'Doodstream' };
  if (url.includes('filemoon'))                            return { type: 'embed', label: 'Filemoon' };
  if (url.includes('mixdrop'))                             return { type: 'embed', label: 'Mixdrop' };
  if (url.includes('mp4upload'))                           return { type: 'embed', label: 'MP4Upload' };
  if (url.includes('upcloud'))                             return { type: 'embed', label: 'Upcloud' };
  if (url.includes('vidstream') || url.includes('vidsrc')) return { type: 'embed', label: 'Vidstream' };
  if (url.includes('archive.org'))                         return { type: 'mp4',   label: 'Internet Archive' };
  return { type: 'mp4', label: 'Direct Link' };
}

// Map OMDB genres to our genre list
function mapGenres(omdbGenres = []) {
  const map = {
    'Sci-Fi': 'Sci-Fi', 'Science Fiction': 'Sci-Fi',
    'Action': 'Action', 'Adventure': 'Adventure', 'Animation': 'Animation',
    'Comedy': 'Comedy', 'Crime': 'Crime', 'Documentary': 'Documentary',
    'Drama': 'Drama', 'Fantasy': 'Fantasy', 'Horror': 'Horror',
    'Musical': 'Musical', 'Music': 'Musical', 'Mystery': 'Mystery',
    'Romance': 'Romance', 'Thriller': 'Thriller', 'Western': 'Western',
  };
  return omdbGenres.map(g => map[g] || g).filter(Boolean);
}

const GENRES_LIST = [
  'Action','Adventure','Animation','Comedy','Crime','Documentary',
  'Drama','Fantasy','Horror','Musical','Mystery','Romance',
  'Sci-Fi','Thriller','Western','Classic',
];

const URL_TEMPLATE = `Movie Title 1 | https://vidstream.pro/embed/XXXXX | Action,Drama | 2023 | https://poster-url.jpg
Movie Title 2 | https://streamtape.com/e/XXXXX | Horror | 2022 | https://poster-url.jpg
Movie Title 3 | https://archive.org/download/.../file.mp4 | Comedy,Classic | 1925`;

const JSON_TEMPLATE = `[
  {
    "title": "Inception",
    "streamUrl": "https://vidstream.pro/embed/XXXXX",
    "year": 2010,
    "genre": ["Sci-Fi", "Thriller"]
  },
  {
    "title": "The Dark Knight",
    "streamUrl": "https://streamtape.com/e/XXXXX",
    "year": 2008,
    "genre": ["Action", "Crime"]
  }
]`;

/* ─── Bulk Import Modal ───────────────────────────────────────────────────── */
function BulkImportModal({ onClose, onDone }) {
  const [mode,       setMode]       = useState('urls');
  const [text,       setText]       = useState('');
  const [parsed,     setParsed]     = useState([]);
  const [parseError, setParseError] = useState('');
  const [importing,  setImporting]  = useState(false);
  const [progress,   setProgress]   = useState({ done: 0, total: 0, errors: [] });
  const [step,       setStep]       = useState('input');
  const [autoFetch,  setAutoFetch]  = useState(true);
  const [fetchStatus, setFetchStatus] = useState({});

  const parseUrlList = (raw) => {
    const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);
    const movies = []; const errors = [];
    lines.forEach((line, i) => {
      const parts = line.split('|').map(p => p.trim());
      if (parts.length < 2) { errors.push(`Line ${i+1}: needs "Title | URL"`); return; }
      const [title, streamUrl, genreStr, year, poster] = parts;
      if (!title || !streamUrl) { errors.push(`Line ${i+1}: missing title or URL`); return; }
      movies.push({
        title: title.trim(), streamUrl: streamUrl.trim(),
        genre: genreStr ? genreStr.split(',').map(g => g.trim()).filter(Boolean) : [],
        year: year ? parseInt(year.trim()) : new Date().getFullYear(),
        poster: poster?.trim() || '',
        description: '', rating: 0, isPublished: true,
      });
    });
    return { movies, errors };
  };

  const parseJson = (raw) => {
    try {
      const data = JSON.parse(raw);
      if (!Array.isArray(data)) return { movies: [], errors: ['JSON must be an array [ ]'] };
      const movies = data.map((m, i) => {
        if (!m.title)     throw new Error(`Item ${i+1} missing "title"`);
        if (!m.streamUrl) throw new Error(`Item ${i+1} missing "streamUrl"`);
        return {
          title: m.title, description: m.description || '',
          year: m.year || new Date().getFullYear(), rating: m.rating || 0,
          genre: Array.isArray(m.genre) ? m.genre : [m.genre || 'Drama'],
          poster: m.poster || '', streamUrl: m.streamUrl,
          director: m.director || '', cast: m.cast || [],
          duration: m.duration || 0, isPublished: true,
        };
      });
      return { movies, errors: [] };
    } catch (e) { return { movies: [], errors: [e.message] }; }
  };

  const handlePreview = async () => {
    setParseError('');
    const { movies, errors } = mode === 'urls' ? parseUrlList(text) : parseJson(text);
    if (errors.length && !movies.length) { setParseError(errors.join('\n')); return; }

    if (autoFetch) {
      // Auto-fill missing info from OMDB
      setStep('fetching');
      const enriched = [...movies];
      for (let i = 0; i < enriched.length; i++) {
        const m = enriched[i];
        setFetchStatus(s => ({ ...s, [i]: 'loading' }));
        try {
          const res = await adminApi.fetchMovieInfo(m.title, m.year);
          const info = res.data;
          // Only fill in fields that are missing
          if (!m.poster       && info.poster)      enriched[i].poster      = info.poster;
          if (!m.description  && info.description) enriched[i].description = info.description;
          if (m.rating === 0  && info.rating)      enriched[i].rating      = info.rating;
          if (!m.director     && info.director)    enriched[i].director    = info.director;
          if (!m.cast?.length && info.cast?.length) enriched[i].cast       = info.cast;
          if (!m.genre?.length && info.genre?.length) enriched[i].genre    = mapGenres(info.genre);
          if (!m.duration     && info.duration)    enriched[i].duration    = info.duration;
          setFetchStatus(s => ({ ...s, [i]: 'done' }));
        } catch {
          setFetchStatus(s => ({ ...s, [i]: 'failed' }));
        }
        await new Promise(r => setTimeout(r, 300)); // small delay between requests
      }
      setParsed(enriched);
    } else {
      setParsed(movies);
    }
    setStep('preview');
  };

  const handleImport = async () => {
    setStep('importing');
    setProgress({ done: 0, total: parsed.length, errors: [] });
    const errors = [];

    for (let i = 0; i < parsed.length; i++) {
      const movie = parsed[i];
      try {
        const fd = new FormData();
        fd.append('title',       movie.title);
        fd.append('description', movie.description || '');
        fd.append('year',        movie.year);
        fd.append('rating',      movie.rating || 0);
        fd.append('duration',    movie.duration || 0);
        fd.append('director',    movie.director || '');
        fd.append('cast',        JSON.stringify(movie.cast || []));
        fd.append('genre',       JSON.stringify(movie.genre?.length ? movie.genre : ['Drama']));
        fd.append('poster',      movie.poster || '');
        fd.append('streamUrl',   movie.streamUrl);
        fd.append('isPublished', true);
        fd.append('streamSources', JSON.stringify([{
          provider: detectStreamType(movie.streamUrl).label.toLowerCase().replace(' ','') || 'direct',
          quality: 'auto', url: movie.streamUrl,
          isHLS: movie.streamUrl.endsWith('.m3u8'),
        }]));
        await adminApi.createMovie(fd);
        setProgress(p => ({ ...p, done: p.done + 1 }));
      } catch (e) {
        errors.push(`"${movie.title}" — ${e.response?.data?.message || e.message}`);
        setProgress(p => ({ ...p, done: p.done + 1, errors: [...p.errors, `Failed: ${movie.title}`] }));
      }
      await new Promise(r => setTimeout(r, 150));
    }

    setProgress(p => ({ ...p, errors }));
    setStep('done');
  };

  const inp = "w-full bg-cinema-dark border border-cinema-border rounded-xl px-3 py-2.5 text-cinema-text placeholder-cinema-muted outline-none focus:border-cinema-accent transition-colors text-sm";

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto py-6 px-4">
      <div className="bg-cinema-card border border-cinema-border rounded-2xl w-full max-w-3xl shadow-2xl animate-slide-up my-auto">

        <div className="flex items-center justify-between px-6 py-4 border-b border-cinema-border">
          <h2 className="text-lg font-semibold text-white">📦 Bulk Import Movies</h2>
          <button onClick={onClose} className="text-cinema-muted hover:text-white transition-colors"><FiX size={20}/></button>
        </div>

        <div className="p-6">

          {/* INPUT STEP */}
          {(step === 'input') && (
            <>
              <div className="flex gap-1 mb-5 bg-cinema-dark border border-cinema-border rounded-xl p-1 w-fit">
                {[{id:'urls',label:'📋 URL List'},{id:'json',label:'{ } JSON'}].map(m=>(
                  <button key={m.id} onClick={()=>setMode(m.id)}
                    className={`px-4 py-2 rounded-lg text-sm transition-colors ${mode===m.id?'bg-cinema-accent text-white':'text-cinema-muted hover:text-white'}`}>
                    {m.label}
                  </button>
                ))}
              </div>

              {mode==='urls' && (
                <>
                  <p className="text-cinema-muted text-sm mb-3">
                    One movie per line: <code className="text-cinema-accent bg-cinema-dark px-1 rounded text-xs">Title | StreamURL | Genre1,Genre2 | Year | PosterURL</code>
                    <br/><span className="text-xs">Only Title and StreamURL are required — everything else auto-fills!</span>
                  </p>
                  <textarea value={text} onChange={e=>setText(e.target.value)}
                    placeholder={URL_TEMPLATE} rows={8}
                    className={`${inp} resize-none font-mono text-xs`}/>
                  <button onClick={()=>setText(URL_TEMPLATE)} className="text-cinema-accent text-xs hover:underline mt-1">Load example</button>
                </>
              )}

              {mode==='json' && (
                <>
                  <p className="text-cinema-muted text-sm mb-3">
                    JSON array — only <code className="text-cinema-accent bg-cinema-dark px-1 rounded text-xs">title</code> and <code className="text-cinema-accent bg-cinema-dark px-1 rounded text-xs">streamUrl</code> required. Everything else auto-fills!
                  </p>
                  <textarea value={text} onChange={e=>setText(e.target.value)}
                    placeholder={JSON_TEMPLATE} rows={12}
                    className={`${inp} resize-none font-mono text-xs`}/>
                  <button onClick={()=>setText(JSON_TEMPLATE)} className="text-cinema-accent text-xs hover:underline mt-1">Load example</button>
                </>
              )}

              {parseError && (
                <div className="mt-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs px-4 py-3 rounded-xl whitespace-pre-wrap">{parseError}</div>
              )}

              {/* Auto-fetch toggle */}
              <div className="mt-4 flex items-center gap-3 p-4 bg-cinema-dark border border-cinema-border rounded-xl">
                <label className="flex items-center gap-3 cursor-pointer flex-1">
                  <input type="checkbox" checked={autoFetch} onChange={e=>setAutoFetch(e.target.checked)}
                    className="w-4 h-4 accent-cinema-accent"/>
                  <div>
                    <p className="text-cinema-text text-sm font-medium flex items-center gap-1.5">
                      <FiZap className="text-cinema-gold" size={14}/> Auto-fetch movie info
                    </p>
                    <p className="text-cinema-muted text-xs mt-0.5">
                      Automatically fills in poster, description, rating, director, and cast from the movie title
                    </p>
                  </div>
                </label>
              </div>

              <div className="flex gap-3 mt-5">
                <button onClick={handlePreview} disabled={!text.trim()}
                  className="flex-1 bg-cinema-accent hover:bg-red-700 text-white py-3 rounded-xl font-semibold transition-all disabled:opacity-40">
                  {autoFetch ? '⚡ Preview & Auto-Fill Info →' : 'Preview Movies →'}
                </button>
                <button onClick={onClose} className="px-6 py-3 border border-cinema-border rounded-xl text-cinema-muted hover:border-cinema-accent transition-colors">Cancel</button>
              </div>
            </>
          )}

          {/* FETCHING STEP */}
          {step === 'fetching' && (
            <div className="text-center py-8">
              <div className="text-5xl mb-4 animate-pulse">🔍</div>
              <p className="text-white font-semibold text-lg mb-2">Fetching movie info...</p>
              <p className="text-cinema-muted text-sm">Looking up posters, descriptions, and ratings automatically</p>
              <div className="mt-6 space-y-2 max-h-64 overflow-y-auto text-left">
                {Object.entries(fetchStatus).map(([i, status]) => (
                  <div key={i} className="flex items-center gap-3 bg-cinema-dark rounded-lg px-3 py-2">
                    <span className="text-lg">
                      {status==='loading' ? '⏳' : status==='done' ? '✅' : '❌'}
                    </span>
                    <span className="text-cinema-text text-sm truncate">
                      {parsed[i]?.title || `Movie ${parseInt(i)+1}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PREVIEW STEP */}
          {step === 'preview' && (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-white font-medium">
                  <span className="text-cinema-accent">{parsed.length} movies</span> ready to import
                </p>
                <button onClick={()=>setStep('input')} className="text-cinema-muted text-sm hover:text-white transition-colors">← Edit</button>
              </div>

              <div className="max-h-80 overflow-y-auto space-y-2 mb-5 pr-1">
                {parsed.map((m,i) => {
                  const sType = detectStreamType(m.streamUrl);
                  return (
                    <div key={i} className="flex items-center gap-3 bg-cinema-dark border border-cinema-border rounded-xl px-4 py-3">
                      {/* Poster preview */}
                      {m.poster ? (
                        <img src={m.poster} alt="" className="w-8 h-12 object-cover rounded shrink-0"
                          onError={e => e.target.style.display='none'}/>
                      ) : (
                        <div className="w-8 h-12 bg-cinema-border rounded shrink-0 flex items-center justify-center text-cinema-muted text-xs">🎬</div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-cinema-text font-medium truncate">{m.title}</p>
                        <p className="text-cinema-muted text-xs">
                          {m.year}
                          {m.rating > 0 && ` · ⭐ ${m.rating}`}
                          {m.genre?.length > 0 && ` · ${m.genre.slice(0,2).join(', ')}`}
                        </p>
                        {m.poster && <p className="text-green-400 text-xs">✅ Poster found</p>}
                        {!m.poster && <p className="text-yellow-400 text-xs">⚠️ No poster</p>}
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                        sType.type==='mp4'?'bg-green-500/20 text-green-400':
                        sType.type==='hls'?'bg-blue-500/20 text-blue-400':
                        'bg-yellow-500/20 text-yellow-400'}`}>
                        {sType.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-3">
                <button onClick={handleImport}
                  className="flex-1 bg-cinema-accent hover:bg-red-700 text-white py-3 rounded-xl font-semibold transition-all">
                  ✅ Import All {parsed.length} Movies
                </button>
                <button onClick={()=>setStep('input')}
                  className="px-6 py-3 border border-cinema-border rounded-xl text-cinema-muted hover:border-cinema-accent transition-colors">
                  Back
                </button>
              </div>
            </>
          )}

          {/* IMPORTING STEP */}
          {step === 'importing' && (
            <div className="text-center py-8">
              <div className="text-5xl mb-4 animate-pulse">🎬</div>
              <p className="text-white font-semibold text-lg mb-2">Importing movies...</p>
              <p className="text-cinema-muted text-sm mb-6">{progress.done} of {progress.total} done</p>
              <div className="w-full bg-cinema-dark rounded-full h-3 mb-2">
                <div className="bg-cinema-accent h-3 rounded-full transition-all duration-300"
                  style={{width:`${(progress.done/progress.total)*100}%`}}/>
              </div>
              <p className="text-cinema-muted text-xs">{Math.round((progress.done/progress.total)*100)}%</p>
            </div>
          )}

          {/* DONE STEP */}
          {step === 'done' && (
            <div className="text-center py-8">
              <div className="text-5xl mb-4">{progress.errors.length===0?'🎉':'⚠️'}</div>
              <p className="text-white font-semibold text-xl mb-2">
                {progress.errors.length===0 ? 'All movies imported!' : `${progress.total-progress.errors.length} of ${progress.total} imported`}
              </p>
              {progress.errors.length>0&&(
                <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-left max-h-32 overflow-y-auto">
                  {progress.errors.map((e,i)=><p key={i} className="text-red-400 text-xs">{e}</p>)}
                </div>
              )}
              <button onClick={()=>{onDone();onClose();}}
                className="mt-6 bg-cinema-accent hover:bg-red-700 text-white px-8 py-3 rounded-xl font-semibold transition-all">
                Done — View Movies
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Single Movie Form ───────────────────────────────────────────────────── */
function MovieForm({ movie, onSave, onCancel }) {
  const isEdit = !!movie;
  const fileRef = useRef();

  const [form, setForm] = useState({
    title:       movie?.title       || '',
    description: movie?.description || '',
    year:        movie?.year        || new Date().getFullYear(),
    rating:      movie?.rating      || '',
    duration:    movie?.duration    || '',
    director:    movie?.director    || '',
    cast:        movie?.cast?.join(', ') || '',
    poster:      movie?.poster      || '',
    streamUrl:   movie?.streamUrl   || '',
    isFeatured:  movie?.isFeatured  || false,
    isTrending:  movie?.isTrending  || false,
    isPublished: movie?.isPublished !== false,
    language:    movie?.language    || 'English',
  });

  const [selectedGenres, setSelectedGenres] = useState(movie?.genre || []);
  const [posterFile,     setPosterFile]     = useState(null);
  const [posterPreview,  setPosterPreview]  = useState(movie?.poster || '');
  const [loading,        setLoading]        = useState(false);
  const [fetching,       setFetching]       = useState(false);
  const [fetchMsg,       setFetchMsg]       = useState('');
  const [error,          setError]          = useState('');
  const [streamInfo,     setStreamInfo]     = useState(detectStreamType(movie?.streamUrl || ''));
  const [showAdvanced,   setShowAdvanced]   = useState(false);

  const set = (name, value) => setForm(f => ({ ...f, [name]: value }));

  const handleStreamUrl = (val) => { set('streamUrl', val); setStreamInfo(detectStreamType(val)); };
  const handlePosterFile = (e) => {
    const file = e.target.files[0]; if (!file) return;
    setPosterFile(file); setPosterPreview(URL.createObjectURL(file));
  };
  const handlePosterUrl = (val) => {
    set('poster', val);
    if (val) setPosterPreview(val);
  };
  const toggleGenre = (g) =>
    setSelectedGenres(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);

  /* ── Auto-fetch movie info ── */
  const handleAutoFetch = async () => {
    if (!form.title.trim()) { setFetchMsg('Enter a title first'); return; }
    setFetching(true); setFetchMsg('');
    try {
      const res = await adminApi.fetchMovieInfo(form.title.trim(), form.year || undefined);
      const info = res.data;
      let filled = [];

      if (info.poster && !form.poster) {
        set('poster', info.poster);
        setPosterPreview(info.poster);
        filled.push('poster');
      }
      if (info.description && !form.description) { set('description', info.description); filled.push('description'); }
      if (info.rating && !form.rating)            { set('rating', info.rating);           filled.push('rating'); }
      if (info.director && !form.director)        { set('director', info.director);       filled.push('director'); }
      if (info.cast?.length && !form.cast)        { set('cast', info.cast.join(', '));    filled.push('cast'); }
      if (info.duration && !form.duration)        { set('duration', info.duration);       filled.push('duration'); }
      if (info.year && !movie)                    { set('year', info.year);               }
      if (info.language)                          { set('language', info.language);       }
      if (info.genre?.length && selectedGenres.length === 0) {
        const mapped = mapGenres(info.genre);
        setSelectedGenres(mapped);
        filled.push('genres');
      }

      setFetchMsg(filled.length > 0
        ? `✅ Filled in: ${filled.join(', ')}`
        : '✅ Found — but all fields already filled'
      );
    } catch (e) {
      setFetchMsg(`❌ ${e.response?.data?.message || 'Movie not found — fill in manually'}`);
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim())     return setError('Title is required');
    if (!form.streamUrl.trim()) return setError('Stream URL is required');
    if (!selectedGenres.length) return setError('Select at least one genre');
    setError(''); setLoading(true);
    try {
      const fd = new FormData();
      fd.append('title',       form.title.trim());
      fd.append('description', form.description.trim());
      fd.append('year',        form.year);
      fd.append('rating',      form.rating || 0);
      fd.append('duration',    form.duration || 0);
      fd.append('director',    form.director.trim());
      fd.append('cast',        JSON.stringify(form.cast.split(',').map(s=>s.trim()).filter(Boolean)));
      fd.append('genre',       JSON.stringify(selectedGenres));
      fd.append('poster',      form.poster.trim());
      fd.append('streamUrl',   form.streamUrl.trim());
      fd.append('isFeatured',  form.isFeatured);
      fd.append('isTrending',  form.isTrending);
      fd.append('isPublished', form.isPublished);
      fd.append('language',    form.language);
      fd.append('streamSources', JSON.stringify([{
        provider: streamInfo.label.toLowerCase().replace(' ','') || 'direct',
        quality: 'auto', url: form.streamUrl.trim(), isHLS: streamInfo.type === 'hls',
      }]));
      if (posterFile) fd.append('poster', posterFile);
      if (isEdit) await adminApi.updateMovie(movie._id, fd);
      else        await adminApi.createMovie(fd);
      onSave();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save');
    } finally { setLoading(false); }
  };

  const inp = "w-full bg-cinema-dark border border-cinema-border rounded-xl px-3 py-2.5 text-cinema-text placeholder-cinema-muted outline-none focus:border-cinema-accent transition-colors text-sm";
  const lbl = "text-cinema-muted text-xs block mb-1.5 font-medium";

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto py-6 px-4">
      <div className="bg-cinema-card border border-cinema-border rounded-2xl w-full max-w-2xl shadow-2xl animate-slide-up my-auto">

        <div className="flex items-center justify-between px-6 py-4 border-b border-cinema-border">
          <h2 className="text-lg font-semibold text-white">{isEdit?`✏️ Edit: ${movie.title}`:'➕ Add Movie'}</h2>
          <button onClick={onCancel} className="text-cinema-muted hover:text-white p-1 transition-colors"><FiX size={20}/></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl">{error}</div>}

          {/* ── Title + Auto-fetch button ── */}
          <div>
            <label className={lbl}>Title <span className="text-cinema-accent">*</span></label>
            <div className="flex gap-2">
              <input type="text" value={form.title} onChange={e=>set('title',e.target.value)}
                placeholder="Movie title" className={inp}/>
              <button type="button" onClick={handleAutoFetch} disabled={fetching || !form.title.trim()}
                title="Auto-fetch poster, description, rating, cast from title"
                className="shrink-0 flex items-center gap-1.5 bg-cinema-gold/20 hover:bg-cinema-gold/30 text-cinema-gold border border-cinema-gold/40 px-3 py-2.5 rounded-xl text-xs font-medium transition-all disabled:opacity-40 whitespace-nowrap">
                {fetching ? <FiRefreshCw size={13} className="animate-spin"/> : <FiZap size={13}/>}
                {fetching ? 'Fetching...' : 'Auto-fill'}
              </button>
            </div>
            {fetchMsg && (
              <p className={`text-xs mt-1.5 ${fetchMsg.startsWith('✅') ? 'text-green-400' : 'text-red-400'}`}>
                {fetchMsg}
              </p>
            )}
            <p className="text-cinema-muted text-xs mt-1">
              💡 Type the title then click <span className="text-cinema-gold">Auto-fill</span> to automatically fetch poster, description, rating, director, and cast
            </p>
          </div>

          {/* ── Stream URL ── */}
          <div>
            <label className={lbl}>🎬 Stream URL <span className="text-cinema-accent">*</span></label>
            <div className="relative">
              <FiLink className="absolute left-3 top-1/2 -translate-y-1/2 text-cinema-muted" size={15}/>
              <input type="url" value={form.streamUrl} onChange={e=>handleStreamUrl(e.target.value)}
                placeholder="Paste MP4, HLS (.m3u8), Vidstream, Streamtape, Doodstream URL..."
                className={`${inp} pl-9`}/>
            </div>
            {form.streamUrl && (
              <span className={`inline-block mt-1.5 text-xs px-2 py-0.5 rounded-full ${
                streamInfo.type==='hls'?'bg-blue-500/20 text-blue-400':
                streamInfo.type==='mp4'?'bg-green-500/20 text-green-400':
                'bg-yellow-500/20 text-yellow-400'}`}>
                {streamInfo.type==='embed'?'🖥️ ':streamInfo.type==='hls'?'📡 ':'🎥 '}{streamInfo.label}
              </span>
            )}
          </div>

          {/* ── Description ── */}
          <div>
            <label className={lbl}>Description</label>
            <textarea value={form.description} onChange={e=>set('description',e.target.value)}
              placeholder="Auto-filled when you click Auto-fill, or type here..." rows={3}
              className={`${inp} resize-none`}/>
          </div>

          {/* ── Genres ── */}
          <div>
            <label className={lbl}>Genres <span className="text-cinema-accent">*</span> {selectedGenres.length>0&&<span className="text-cinema-accent">({selectedGenres.length} selected)</span>}</label>
            <div className="flex flex-wrap gap-2">
              {GENRES_LIST.map(g=>(
                <button key={g} type="button" onClick={()=>toggleGenre(g)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all ${selectedGenres.includes(g)?'bg-cinema-accent border-cinema-accent text-white':'border-cinema-border text-cinema-muted hover:border-cinema-accent hover:text-cinema-accent'}`}>
                  {selectedGenres.includes(g)&&<FiCheck className="inline mr-1 mb-0.5" size={10}/>}{g}
                </button>
              ))}
            </div>
          </div>

          {/* ── Year + Rating ── */}
          <div className="grid grid-cols-2 gap-4">
            <div><label className={lbl}>Year</label><input type="number" value={form.year} onChange={e=>set('year',e.target.value)} min={1880} max={2030} className={inp}/></div>
            <div><label className={lbl}>Rating (0–10)</label><input type="number" step="0.1" value={form.rating} onChange={e=>set('rating',e.target.value)} min={0} max={10} placeholder="Auto-filled" className={inp}/></div>
          </div>

          {/* ── Poster ── */}
          <div>
            <label className={lbl}>Poster Image</label>
            <div className="flex gap-3">
              {posterPreview && (
                <div className="w-14 h-20 rounded-lg overflow-hidden border border-cinema-border shrink-0">
                  <img src={posterPreview} alt="" className="w-full h-full object-cover"
                    onError={e => { e.target.style.display='none'; setPosterPreview(''); }}/>
                </div>
              )}
              <div className="flex-1 space-y-2">
                <input type="url" value={form.poster} onChange={e=>handlePosterUrl(e.target.value)}
                  placeholder="Auto-filled by Auto-fill button, or paste URL..." className={inp}/>
                <div className="border border-dashed border-cinema-border rounded-xl p-2.5 text-center cursor-pointer hover:border-cinema-accent transition-colors"
                  onClick={()=>fileRef.current?.click()}>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePosterFile}/>
                  <div className="flex items-center justify-center gap-2 text-cinema-muted">
                    <FiUpload size={13}/><span className="text-xs">{posterFile?posterFile.name:'Or upload from your computer'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Advanced ── */}
          <div>
            <button type="button" onClick={()=>setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-cinema-muted hover:text-cinema-text text-sm transition-colors">
              {showAdvanced?<FiChevronUp size={14}/>:<FiChevronDown size={14}/>}
              {showAdvanced?'Hide':'Show'} advanced (director, cast, duration…)
            </button>
            {showAdvanced&&(
              <div className="mt-4 space-y-4 pl-4 border-l-2 border-cinema-border animate-slide-up">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className={lbl}>Duration (min)</label><input type="number" value={form.duration} onChange={e=>set('duration',e.target.value)} placeholder="Auto-filled" className={inp}/></div>
                  <div><label className={lbl}>Language</label><input type="text" value={form.language} onChange={e=>set('language',e.target.value)} className={inp}/></div>
                </div>
                <div><label className={lbl}>Director</label><input type="text" value={form.director} onChange={e=>set('director',e.target.value)} placeholder="Auto-filled" className={inp}/></div>
                <div><label className={lbl}>Cast (comma-separated)</label><input type="text" value={form.cast} onChange={e=>set('cast',e.target.value)} placeholder="Auto-filled" className={inp}/></div>
                <div className="flex flex-wrap gap-5">
                  {[['isFeatured','⭐ Featured'],['isTrending','🔥 Trending'],['isPublished','✅ Published']].map(([name,label])=>(
                    <label key={name} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form[name]} onChange={e=>set(name,e.target.checked)} className="w-4 h-4 accent-cinema-accent"/>
                      <span className="text-cinema-text text-sm">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2 border-t border-cinema-border">
            <button type="submit" disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 bg-cinema-accent hover:bg-red-700 text-white py-3 rounded-xl font-semibold transition-all disabled:opacity-50">
              <FiSave size={15}/>{loading?'Saving...':(isEdit?'Update Movie':'Add Movie')}
            </button>
            <button type="button" onClick={onCancel}
              className="px-6 py-3 border border-cinema-border rounded-xl text-cinema-muted hover:border-cinema-accent transition-colors">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Main Admin Page ─────────────────────────────────────────────────────── */
export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [movies,        setMovies]        = useState([]);
  const [stats,         setStats]         = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [showForm,      setShowForm]      = useState(false);
  const [showBulk,      setShowBulk]      = useState(false);
  const [editingMovie,  setEditingMovie]  = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [search,        setSearch]        = useState('');
  const [tab,           setTab]           = useState('movies');
  const [users,         setUsers]         = useState([]);

  useEffect(() => {
    if (!authLoading && user && user.role !== 'admin') router.replace('/');
  }, [user, authLoading]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [mr, sr] = await Promise.all([adminApi.getMovies(), adminApi.getStats()]);
      setMovies(mr.data); setStats(sr.data);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (user?.role==='admin') loadData(); }, [user]);
  useEffect(() => {
    if (tab==='users'&&users.length===0) adminApi.getUsers().then(r=>setUsers(r.data)).catch(console.error);
  }, [tab]);

  const handleDelete = async (id) => {
    await adminApi.deleteMovie(id);
    setMovies(prev => prev.filter(m => m._id !== id));
    setDeleteConfirm(null);
  };

  const filtered = movies.filter(m => m.title.toLowerCase().includes(search.toLowerCase()));

  if (authLoading || !user) return null;
  if (user.role !== 'admin') return null;

  return (
    <>
      <Head><title>Admin — CineStream</title></Head>
      <div className="min-h-screen bg-cinema-black pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl text-white" style={{fontFamily:'Bebas Neue, serif',letterSpacing:'0.1em'}}>Admin Panel</h1>
              <p className="text-cinema-muted text-sm mt-0.5">Manage your movie library</p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/admin/scraper" className="flex items-center gap-2 bg-cinema-accent hover:bg-red-700 text-white text-sm px-4 py-2.5 rounded-xl font-medium transition-colors">
                🎬 Movie Scraper
              </Link>
              <Link href="/admin/tv" className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-sm px-4 py-2.5 rounded-xl font-medium transition-colors">
                📺 TV Shows
              </Link>
              <Link href="/" className="flex items-center gap-1.5 text-cinema-muted hover:text-white text-sm transition-colors">
                <MdLocalMovies size={16}/> View Site
              </Link>
            </div>
          </div>

          {stats&&(
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              {[
                {label:'Total Movies',value:stats.totalMovies,icon:'🎬'},
                {label:'Total Users', value:stats.totalUsers, icon:'👤'},
                {label:'Top Movie',   value:stats.topMovies?.[0]?.title||'—',icon:'🏆'},
                {label:'Most Viewed', value:stats.topMovies?.[0]?.views??'—',icon:'👁️'},
              ].map(({label,value,icon})=>(
                <div key={label} className="bg-cinema-card border border-cinema-border rounded-2xl p-4">
                  <p className="text-2xl mb-1">{icon}</p>
                  <p className="text-cinema-muted text-xs">{label}</p>
                  <p className="text-white font-bold mt-0.5 truncate">{value}</p>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-1 mb-6 bg-cinema-card border border-cinema-border rounded-xl p-1 w-fit">
            {['movies','users'].map(t=>(
              <button key={t} onClick={()=>setTab(t)}
                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${tab===t?'bg-cinema-accent text-white':'text-cinema-muted hover:text-white'}`}>
                {t==='movies'?`🎬 Movies (${movies.length})`:'👤 Users'}
              </button>
            ))}
          </div>

          {tab==='movies'&&(
            <>
              <div className="flex flex-col sm:flex-row gap-3 mb-5">
                <div className="relative flex-1">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-cinema-muted" size={15}/>
                  <input type="text" value={search} onChange={e=>setSearch(e.target.value)}
                    placeholder="Search movies..."
                    className="w-full bg-cinema-card border border-cinema-border rounded-xl pl-9 pr-4 py-2.5 text-cinema-text placeholder-cinema-muted outline-none focus:border-cinema-accent transition-colors text-sm"/>
                </div>
                <div className="flex gap-2">
                  <button onClick={()=>setShowBulk(true)}
                    className="flex items-center gap-2 bg-cinema-dark border border-cinema-border hover:border-cinema-accent text-cinema-muted hover:text-white px-4 py-2.5 rounded-xl text-sm transition-all whitespace-nowrap">
                    <FiList size={15}/> Bulk Import
                  </button>
                  <button onClick={()=>{setEditingMovie(null);setShowForm(true);}}
                    className="flex items-center gap-2 bg-cinema-accent hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-colors whitespace-nowrap">
                    <FiPlus size={15}/> Add Movie
                  </button>
                </div>
              </div>

              {loading?(
                <div className="space-y-3">{Array.from({length:5}).map((_,i)=><div key={i} className="h-16 rounded-xl shimmer"/>)}</div>
              ):(
                <div className="bg-cinema-card border border-cinema-border rounded-2xl overflow-hidden">
                  {filtered.length===0?(
                    <div className="text-center py-16">
                      <p className="text-4xl mb-3">🎬</p>
                      <p className="text-cinema-muted">{search?'No movies match':'No movies yet'}</p>
                      {!search&&(
                        <div className="flex items-center justify-center gap-3 mt-4">
                          <button onClick={()=>setShowBulk(true)} className="border border-cinema-border text-cinema-muted hover:border-cinema-accent hover:text-cinema-accent px-5 py-2.5 rounded-xl text-sm transition-colors">Bulk Import</button>
                          <button onClick={()=>{setEditingMovie(null);setShowForm(true);}} className="bg-cinema-accent text-white px-5 py-2.5 rounded-xl text-sm hover:bg-red-700 transition-colors">Add Movie</button>
                        </div>
                      )}
                    </div>
                  ):(
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-cinema-border text-left">
                            <th className="text-cinema-muted px-4 py-3 font-medium">Movie</th>
                            <th className="text-cinema-muted px-4 py-3 font-medium hidden sm:table-cell">Year</th>
                            <th className="text-cinema-muted px-4 py-3 font-medium hidden md:table-cell">Genre</th>
                            <th className="text-cinema-muted px-4 py-3 font-medium hidden lg:table-cell">Stream</th>
                            <th className="text-cinema-muted px-4 py-3 font-medium">Status</th>
                            <th className="text-cinema-muted px-4 py-3 font-medium text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filtered.map(movie=>{
                            const sType=detectStreamType(movie.streamUrl||'');
                            return(
                              <tr key={movie._id} className="border-b border-cinema-border/40 hover:bg-white/[0.02] transition-colors">
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-12 rounded overflow-hidden bg-cinema-border shrink-0">
                                      {movie.poster
                                        ?<img src={movie.poster} alt="" className="w-full h-full object-cover"/>
                                        :<div className="w-full h-full flex items-center justify-center text-xs">🎬</div>}
                                    </div>
                                    <div>
                                      <p className="text-cinema-text font-medium line-clamp-1 max-w-[180px]">{movie.title}</p>
                                      <p className="text-cinema-muted text-xs">{movie.views||0} views</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-cinema-muted hidden sm:table-cell">{movie.year}</td>
                                <td className="px-4 py-3 text-cinema-muted hidden md:table-cell text-xs">{movie.genre?.slice(0,2).join(', ')}</td>
                                <td className="px-4 py-3 hidden lg:table-cell">
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${sType.type==='mp4'?'bg-green-500/20 text-green-400':sType.type==='hls'?'bg-blue-500/20 text-blue-400':sType.type==='embed'?'bg-yellow-500/20 text-yellow-400':'bg-cinema-border text-cinema-muted'}`}>
                                    {sType.label||'None'}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${movie.isPublished?'bg-green-500/20 text-green-400':'bg-yellow-500/20 text-yellow-400'}`}>
                                    {movie.isPublished?'Live':'Draft'}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center justify-end gap-1">
                                    <Link href={`/movie/${movie._id}`} className="p-1.5 text-cinema-muted hover:text-white transition-colors rounded-lg hover:bg-cinema-border"><FiEye size={15}/></Link>
                                    <button onClick={()=>{setEditingMovie(movie);setShowForm(true);}} className="p-1.5 text-cinema-muted hover:text-blue-400 transition-colors rounded-lg hover:bg-cinema-border"><FiEdit2 size={15}/></button>
                                    <button onClick={()=>setDeleteConfirm(movie._id)} className="p-1.5 text-cinema-muted hover:text-red-400 transition-colors rounded-lg hover:bg-cinema-border"><FiTrash2 size={15}/></button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-6 bg-cinema-card border border-cinema-border rounded-2xl p-5">
                <h3 className="text-white font-semibold mb-3 text-sm">⚡ Quick Guide</h3>
                <div className="grid sm:grid-cols-2 gap-4 text-xs text-cinema-muted">
                  <div><p className="text-cinema-text font-medium mb-1">🪄 Auto-fill (single movie)</p><p>Type the title → click the gold "Auto-fill" button → poster, description, rating, director, cast all fill in automatically.</p></div>
                  <div><p className="text-cinema-text font-medium mb-1">📦 Bulk Import</p><p>Click "Bulk Import" → paste a list of titles + URLs → enable "Auto-fetch" → everything fills in for all movies at once.</p></div>
                  <div><p className="text-cinema-text font-medium mb-1">🖥️ Vidstream / Streamtape</p><p>Paste the embed URL (e.g. vidstream.pro/embed/XXXX) → auto-detected as iframe. The provider's player handles playback.</p></div>
                  <div><p className="text-cinema-text font-medium mb-1">🏛️ Internet Archive</p><p>Find film on archive.org → right-click .mp4 → Copy link → paste as Stream URL. Free and legal.</p></div>
                </div>
              </div>
            </>
          )}

          {tab==='users'&&(
            <div className="bg-cinema-card border border-cinema-border rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-cinema-border">
                    <th className="text-left text-cinema-muted px-4 py-3 font-medium">Username</th>
                    <th className="text-left text-cinema-muted px-4 py-3 font-medium">Email</th>
                    <th className="text-left text-cinema-muted px-4 py-3 font-medium">Role</th>
                    <th className="text-left text-cinema-muted px-4 py-3 font-medium hidden md:table-cell">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u=>(
                    <tr key={u._id} className="border-b border-cinema-border/40 hover:bg-white/[0.02]">
                      <td className="px-4 py-3 text-cinema-text font-medium">{u.username}</td>
                      <td className="px-4 py-3 text-cinema-muted">{u.email}</td>
                      <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${u.role==='admin'?'bg-cinema-accent/20 text-cinema-accent':'bg-cinema-border text-cinema-muted'}`}>{u.role}</span></td>
                      <td className="px-4 py-3 text-cinema-muted text-xs hidden md:table-cell">{new Date(u.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showForm&&<MovieForm movie={editingMovie} onSave={()=>{setShowForm(false);loadData();}} onCancel={()=>setShowForm(false)}/>}
      {showBulk&&<BulkImportModal onClose={()=>setShowBulk(false)} onDone={loadData}/>}

      {deleteConfirm&&(
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center px-4">
          <div className="bg-cinema-card border border-cinema-border rounded-2xl p-6 max-w-sm w-full animate-slide-up shadow-2xl">
            <p className="text-xl mb-1">🗑️</p>
            <h3 className="text-lg font-semibold text-white mb-1">Delete this movie?</h3>
            <p className="text-cinema-muted text-sm mb-6">This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={()=>handleDelete(deleteConfirm)} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl font-medium transition-colors">Yes, delete</button>
              <button onClick={()=>setDeleteConfirm(null)} className="flex-1 border border-cinema-border text-cinema-muted hover:border-cinema-accent hover:text-cinema-accent py-2.5 rounded-xl transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
