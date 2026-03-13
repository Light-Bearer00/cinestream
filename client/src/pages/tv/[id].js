/**
 * /tv/[id] — TV Show detail page
 * Saves episode watch progress and resumes from last watched position.
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { tvApi } from '../../utils/api';
import VideoPlayer from '../../components/player/VideoPlayer';
import {
  saveEpisodeProgress, getEpisodeProgress,
  getShowLastWatched, formatTimeRemaining
} from '../../utils/watchProgress';
import { FiStar, FiCalendar, FiTv, FiPlay, FiChevronDown, FiChevronUp, FiGlobe } from 'react-icons/fi';

export default function TVShowPage() {
  const router = useRouter();
  const { id, resume } = router.query;

  const [show,           setShow]           = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [seasonData,     setSeasonData]     = useState(null);
  const [seasonLoading,  setSeasonLoading]  = useState(false);
  const [playingEp,      setPlayingEp]      = useState(null);
  const [expandedEps,    setExpandedEps]    = useState(false);
  const [imgError,       setImgError]       = useState(false);
  const [lastWatched,    setLastWatched]    = useState(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    tvApi.getById(id)
      .then(r => {
        setShow(r.data);
        // Check last watched episode
        const lw = getShowLastWatched(id);
        setLastWatched(lw);
        // If resume param set, go to that season
        if (resume) {
          const match = resume.match(/s(\d+)e(\d+)/i);
          if (match) setSelectedSeason(parseInt(match[1]));
        } else if (lw) {
          setSelectedSeason(lw.season);
        } else {
          setSelectedSeason(1);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id || !show) return;
    setSeasonLoading(true);
    setPlayingEp(null);
    tvApi.getSeason(id, selectedSeason)
      .then(r => {
        setSeasonData(r.data);
        // Auto-play resumed episode if requested
        if (resume) {
          const match = resume.match(/s(\d+)e(\d+)/i);
          if (match && parseInt(match[1]) === selectedSeason) {
            const epNum = parseInt(match[2]);
            const ep = r.data?.episodes?.find(e => e.episodeNumber === epNum);
            if (ep) setTimeout(() => playEpisode(ep), 300);
          }
        }
      })
      .catch(() => setSeasonData(null))
      .finally(() => setSeasonLoading(false));
  }, [id, selectedSeason, show]);

  const playEpisode = (episode) => {
    setPlayingEp({
      season:  selectedSeason,
      episode: episode.episodeNumber,
      title:   `S${selectedSeason}E${episode.episodeNumber} — ${episode.title}`,
      sources: episode.streamSources || [],
    });
    setTimeout(() => {
      document.getElementById('player-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Save progress callback
  // episodeRuntime is in minutes — convert to seconds for accurate progress
  const handleProgress = useCallback((currentTime, durationFromPlayer) => {
    if (!show || !playingEp) return;
    // Try to get episode runtime from season data
    const ep = seasonData?.episodes?.find(
      e => e.episodeNumber === playingEp.episode
    );
    const realDuration = ep?.runtime > 0
      ? ep.runtime * 60
      : durationFromPlayer || 2700; // default 45 min for TV episodes
    saveEpisodeProgress(
      id, playingEp.season, playingEp.episode,
      currentTime, realDuration,
      {
        title:     playingEp.title,
        poster:    show.poster,
        showTitle: show.title,
      }
    );
  }, [id, show, playingEp, seasonData]);

  if (loading) {
    return (
      <div className="min-h-screen pt-20">
        <div className="h-96 shimmer" />
        <div className="max-w-7xl mx-auto px-4 mt-8 space-y-4">
          <div className="h-10 w-64 shimmer rounded" />
          <div className="h-4 w-full shimmer rounded" />
        </div>
      </div>
    );
  }

  if (!show) {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center">
        <div className="text-center">
          <p className="text-cinema-muted text-xl">Show not found</p>
          <Link href="/tv" className="text-cinema-accent hover:underline mt-4 inline-block">← Back to TV Shows</Link>
        </div>
      </div>
    );
  }

  const visibleEpisodes = expandedEps
    ? seasonData?.episodes || []
    : (seasonData?.episodes || []).slice(0, 6);

  return (
    <>
      <Head><title>{show.title} — RoyalQueen</title></Head>

      {/* Backdrop */}
      <div className="relative h-[45vh] min-h-72 overflow-hidden">
        {(show.backdrop || show.poster) && !imgError ? (
          <Image src={show.backdrop || show.poster} alt={show.title} fill
            className="object-cover object-top" priority unoptimized onError={() => setImgError(true)} />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-cinema-card to-cinema-black" />
        )}
        <div className="hero-gradient absolute inset-0" />
        <div className="bottom-gradient absolute bottom-0 left-0 right-0 h-60" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-32 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Poster */}
          <div className="hidden lg:block">
            <div className="sticky top-24 aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border border-cinema-border bg-cinema-card">
              {show.poster && !imgError ? (
                <Image src={show.poster} alt={show.title} fill className="object-cover" unoptimized onError={() => setImgError(true)} />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                  <FiTv className="text-cinema-muted text-6xl" />
                  <p className="text-cinema-muted text-sm text-center px-4">{show.title}</p>
                </div>
              )}
              {/* Last watched badge on poster */}
              {lastWatched && (
                <div className="absolute bottom-0 left-0 right-0">
                  <div className="h-1.5 bg-white/20">
                    <div className="h-full bg-cinema-accent" style={{ width: `${lastWatched.percent}%` }} />
                  </div>
                  <div className="bg-black/70 text-cinema-accent text-xs text-center py-1 font-medium">
                    S{lastWatched.season} E{lastWatched.episode} · {formatTimeRemaining(lastWatched.currentTime, lastWatched.duration)}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="lg:col-span-2 space-y-5">

            <div className="flex flex-wrap gap-2 pt-8 lg:pt-0">
              {show.genre?.map(g => (
                <span key={g} className="text-xs text-cinema-accent border border-cinema-accent/40 px-2.5 py-1 rounded-full">{g}</span>
              ))}
              {show.status && (
                <span className={`text-xs px-2.5 py-1 rounded-full border ${
                  show.status === 'Returning Series'
                    ? 'text-green-400 border-green-400/40 bg-green-400/10'
                    : 'text-cinema-muted border-cinema-border'
                }`}>{show.status}</span>
              )}
            </div>

            <h1 className="text-4xl md:text-6xl text-white leading-none"
              style={{ fontFamily: 'Bebas Neue, serif', letterSpacing: '0.05em' }}>
              {show.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-sm text-cinema-muted">
              {show.year > 0 && (
                <div className="flex items-center gap-1.5">
                  <FiCalendar size={13} />
                  <span>{show.year}{show.endYear > 0 && show.endYear !== show.year ? `–${show.endYear}` : ''}</span>
                </div>
              )}
              {show.totalSeasons > 0 && (
                <div className="flex items-center gap-1.5">
                  <FiTv size={13} />
                  <span>{show.totalSeasons} Season{show.totalSeasons > 1 ? 's' : ''}</span>
                </div>
              )}
              {show.rating > 0 && (
                <div className="flex items-center gap-1.5">
                  <FiStar className="text-cinema-gold fill-cinema-gold" size={13} />
                  <span className="text-cinema-gold font-semibold">{Number(show.rating).toFixed(1)}</span>
                  <span>/10</span>
                </div>
              )}
              {show.network && <span>{show.network}</span>}
              {show.language && (
                <div className="flex items-center gap-1.5"><FiGlobe size={13} /><span>{show.language}</span></div>
              )}
            </div>

            <p className="text-cinema-muted leading-relaxed">{show.description}</p>

            {show.cast?.length > 0 && (
              <div className="text-sm">
                <span className="text-cinema-muted">Cast: </span>
                <span className="text-cinema-text">{show.cast.slice(0, 6).join(', ')}</span>
              </div>
            )}

            {/* Continue watching banner */}
            {lastWatched && (
              <div className="flex items-center gap-4 bg-cinema-card border border-cinema-accent/30 rounded-xl p-4">
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium">Continue Watching</p>
                  <p className="text-cinema-muted text-xs mt-0.5">
                    S{lastWatched.season} E{lastWatched.episode} · {formatTimeRemaining(lastWatched.currentTime, lastWatched.duration)}
                  </p>
                  <div className="mt-2 h-1 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-cinema-accent rounded-full" style={{ width: `${lastWatched.percent}%` }} />
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedSeason(lastWatched.season);
                    const ep = seasonData?.episodes?.find(e => e.episodeNumber === lastWatched.episode);
                    if (ep) playEpisode(ep);
                  }}
                  className="flex items-center gap-2 bg-cinema-accent hover:bg-red-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shrink-0"
                >
                  <FiPlay size={14} className="fill-white" /> Resume
                </button>
              </div>
            )}

            {/* Season Selector */}
            {show.totalSeasons > 0 && (
              <div>
                <h2 className="text-xl text-white mb-3" style={{ fontFamily: 'Bebas Neue, serif', letterSpacing: '0.1em' }}>
                  SEASONS
                </h2>
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: show.totalSeasons }, (_, i) => i + 1).map(s => (
                    <button key={s} onClick={() => setSelectedSeason(s)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                        selectedSeason === s
                          ? 'bg-cinema-accent border-cinema-accent text-white'
                          : 'bg-cinema-card border-cinema-border text-cinema-muted hover:border-cinema-accent hover:text-white'
                      }`}>
                      Season {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Episodes List */}
            <div>
              <h2 className="text-xl text-white mb-3" style={{ fontFamily: 'Bebas Neue, serif', letterSpacing: '0.1em' }}>
                SEASON {selectedSeason} EPISODES
                {seasonData && (
                  <span className="text-cinema-muted text-sm font-sans ml-2 normal-case tracking-normal">
                    ({seasonData.episodeCount || seasonData.episodes?.length || 0} episodes)
                  </span>
                )}
              </h2>

              {seasonLoading ? (
                <div className="space-y-3">
                  {Array(4).fill(0).map((_, i) => <div key={i} className="h-16 shimmer rounded-xl" />)}
                </div>
              ) : !seasonData ? (
                <div className="text-cinema-muted text-sm py-4">Season data not available.</div>
              ) : (
                <>
                  <div className="space-y-2">
                    {visibleEpisodes.map(ep => {
                      const epProg = getEpisodeProgress(id, selectedSeason, ep.episodeNumber);
                      const isPlaying = playingEp?.episode === ep.episodeNumber && playingEp?.season === selectedSeason;

                      return (
                        <div
                          key={ep.episodeNumber}
                          className={`flex items-center gap-4 p-3 rounded-xl border transition-all cursor-pointer group ${
                            isPlaying
                              ? 'border-cinema-accent bg-cinema-accent/10'
                              : 'border-cinema-border bg-cinema-card hover:border-cinema-accent/50'
                          }`}
                          onClick={() => playEpisode(ep)}
                        >
                          {/* Thumbnail */}
                          <div className="relative w-24 h-14 rounded-lg overflow-hidden shrink-0 bg-cinema-dark">
                            {ep.stillImage ? (
                              <Image src={ep.stillImage} alt={ep.title} fill className="object-cover" unoptimized />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <FiPlay className="text-cinema-muted" size={20} />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <FiPlay className="text-white fill-white" size={18} />
                            </div>
                            {/* Progress bar on thumbnail */}
                            {epProg && epProg.percent > 2 && epProg.percent < 95 && (
                              <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
                                <div className="h-full bg-cinema-accent" style={{ width: `${epProg.percent}%` }} />
                              </div>
                            )}
                            {/* Watched checkmark */}
                            {epProg && epProg.percent >= 95 && (
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <span className="text-green-400 text-xl">✓</span>
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-cinema-accent text-xs font-bold shrink-0">E{ep.episodeNumber}</span>
                              <p className="text-cinema-text text-sm font-medium truncate">{ep.title}</p>
                              {ep.runtime > 0 && (
                                <span className="text-cinema-muted text-xs shrink-0">{ep.runtime}m</span>
                              )}
                            </div>
                            {ep.overview && (
                              <p className="text-cinema-muted text-xs mt-0.5 line-clamp-1">{ep.overview}</p>
                            )}
                            {/* Time remaining */}
                            {epProg && epProg.percent > 2 && epProg.percent < 95 && (
                              <p className="text-cinema-accent text-xs mt-0.5">
                                {formatTimeRemaining(epProg.currentTime, epProg.duration)}
                              </p>
                            )}
                          </div>

                          <FiPlay
                            className={`shrink-0 transition-colors ${
                              isPlaying ? 'text-cinema-accent fill-cinema-accent' : 'text-cinema-muted group-hover:text-white'
                            }`}
                            size={16}
                          />
                        </div>
                      );
                    })}
                  </div>

                  {(seasonData?.episodes?.length || 0) > 6 && (
                    <button onClick={() => setExpandedEps(!expandedEps)}
                      className="mt-3 flex items-center gap-2 text-cinema-muted hover:text-white text-sm transition-colors">
                      {expandedEps
                        ? <><FiChevronUp size={16}/> Show less</>
                        : <><FiChevronDown size={16}/> Show all {seasonData.episodes.length} episodes</>
                      }
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Video Player */}
            {playingEp && (
              <div id="player-section" className="mt-4 animate-slide-up">
                <h2 className="text-2xl text-white mb-1"
                  style={{ fontFamily: 'Bebas Neue, serif', letterSpacing: '0.1em' }}>
                  NOW PLAYING
                </h2>
                <p className="text-cinema-muted text-sm mb-3">{show.title} · {playingEp.title}</p>

                {playingEp.sources.length > 0 ? (
                  <>
                    <VideoPlayer
                      streamUrl={playingEp.sources[0].url}
                      streamSources={playingEp.sources}
                      title={`${show.title} ${playingEp.title}`}
                      onProgress={handleProgress}
                    />
                    <p className="text-cinema-muted text-xs mt-2">
                      💡 If one server doesn't work, try another. Space = play/pause · F = fullscreen
                    </p>
                  </>
                ) : (
                  <div className="aspect-video bg-cinema-card rounded-xl flex items-center justify-center border border-cinema-border">
                    <p className="text-cinema-muted">No stream available for this episode.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
