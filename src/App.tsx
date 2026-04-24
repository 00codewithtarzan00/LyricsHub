import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
function Visualizer({ isPlaying }: { isPlaying: boolean }) {
  return (
    <div className="flex gap-0.5 items-end h-4 w-4">
      {[1, 2, 3].map((i) => (
        <div 
          key={i} 
          className={`w-1 bg-[#38bdf8] rounded-full transition-all duration-300 ${isPlaying ? 'animate-music-bar' : 'h-1'}`}
          style={{ animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </div>
  );
}

function Toast({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 100 }}
      className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full bg-slate-800 border border-white/10 shadow-2xl flex items-center gap-3 backdrop-blur-xl"
    >
      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
      <span className="text-sm font-bold text-white tracking-wide">{message}</span>
    </motion.div>
  );
}

import { 
  Search, Music, TrendingUp, X, Loader2, Heart, Play, Pause, 
  LayoutDashboard, History as HistoryIcon, Share2, Copy, RefreshCcw 
} from 'lucide-react';
import ReactPlayer from 'react-player';
import { geminiService, type SongMetadata } from './services/geminiService';

const Player = ReactPlayer as any;

function SkeletonCard() {
  return (
    <div className="flex flex-col gap-3 animate-pulse">
      <div className="aspect-square rounded-[32px] bg-white/[0.03] border border-white/5 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 animate-shimmer" />
      </div>
      <div className="px-2 space-y-2 relative overflow-hidden">
        <div className="h-4 bg-white/[0.05] rounded-full w-3/4" />
        <div className="h-3 bg-white/[0.03] rounded-full w-1/2" />
        <div className="absolute inset-0 animate-shimmer" />
      </div>
    </div>
  );
}

function SongCard({ song, isSaved, onToggleSave, onClick }: { song: SongMetadata; isSaved: boolean; onToggleSave: () => void; onClick: () => void }) {
  const [imgSrc, setImgSrc] = useState(`https://i.ytimg.com/vi/${song.videoId}/maxresdefault.jpg`);
  const [fallbackIndex, setFallbackIndex] = useState(0);
  const [hasError, setHasError] = useState(false);

  const fallbacks = [
    `https://i.ytimg.com/vi/${song.videoId}/maxresdefault.jpg`,
    `https://i.ytimg.com/vi/${song.videoId}/hqdefault.jpg`,
    `https://i.ytimg.com/vi/${song.videoId}/mqdefault.jpg`,
    `https://img.youtube.com/vi/${song.videoId}/hqdefault.jpg`
  ];

  useEffect(() => {
    setImgSrc(fallbacks[0]);
    setFallbackIndex(0);
    setHasError(false);
  }, [song.videoId]);

  const handleError = () => {
    if (fallbackIndex < fallbacks.length - 1) {
      const nextIndex = fallbackIndex + 1;
      setFallbackIndex(nextIndex);
      setImgSrc(fallbacks[nextIndex]);
    } else {
      setHasError(true);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      whileTap={{ scale: 0.98 }}
      className="group relative flex flex-col gap-3 cursor-pointer"
      onClick={onClick}
    >
      <div className="aspect-square rounded-[32px] overflow-hidden relative bg-slate-900 border border-white/[0.05] shadow-2xl transition-all duration-500 group-hover:shadow-[#38bdf8]/20 group-hover:border-[#38bdf8]/40">
        {!hasError ? (
          <img 
            src={imgSrc} 
            loading="lazy"
            onError={handleError}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
            <Music size={48} className="text-slate-700" />
          </div>
        )}
        
        {/* Play Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
          <div className="w-14 h-14 rounded-full bg-[#38bdf8] flex items-center justify-center shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
            <Play size={28} fill="currentColor" className="text-black ml-1" />
          </div>
        </div>

        {song.duration && (
          <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg border border-white/10 z-10 transition-transform group-hover:translate-y-[-4px]">
            <span className="text-[10px] font-black text-white tracking-widest">{song.duration}</span>
          </div>
        )}

        <button 
          onClick={(e) => { e.stopPropagation(); onToggleSave(); }}
          className="absolute top-4 right-4 p-2.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:scale-110 active:scale-95 transition-all opacity-0 group-hover:opacity-100 z-10"
        >
          <Heart size={18} fill={isSaved ? "#ef4444" : "none"} className={isSaved ? "text-red-500" : ""} />
        </button>
      </div>

      <div className="px-2">
        <h3 className="font-black text-white text-base leading-tight truncate mb-0.5 group-hover:text-[#38bdf8] transition-colors">{song.name}</h3>
        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider truncate">{song.artist}</p>
      </div>
    </motion.div>
  );
}

export default function App() {
  const [trending, setTrending] = useState<SongMetadata[]>([]);
  const [searchResults, setSearchResults] = useState<SongMetadata[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedSong, setSelectedSong] = useState<SongMetadata | null>(null);
  const [lyrics, setLyrics] = useState<string | null>(null);
  const [isLoadingLyrics, setIsLoadingLyrics] = useState(false);
  const [savedSongs, setSavedSongs] = useState<SongMetadata[]>(() => {
    const saved = localStorage.getItem('lyrics_hub_saved');
    return saved ? JSON.parse(saved) : [];
  });
  const [view, setView] = useState<'trending' | 'saved'>('trending');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeSong, setActiveSong] = useState<SongMetadata | null>(null);
  
  const [history, setHistory] = useState<string[]>(() => {
    const saved = localStorage.getItem('search_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [filter, setFilter] = useState('Trending');
  const [showToast, setShowToast] = useState<string | null>(null);

  const filters = ['Trending', 'Bollywood', 'Punjabi', 'Indie', 'Latest 2025'];
  
  const addToHistory = (q: string) => {
    if (!q.trim()) return;
    setHistory(prev => {
      const filtered = prev.filter(item => item !== q);
      const updated = [q, ...filtered].slice(0, 5);
      localStorage.setItem('search_history', JSON.stringify(updated));
      return updated;
    });
  };

  const handleToast = (msg: string) => {
    setShowToast(msg);
    setTimeout(() => setShowToast(null), 3000);
  };

  const handleShare = (song: SongMetadata) => {
    const text = `Check out this song: ${song.name} by ${song.artist}\nhttps://www.youtube.com/watch?v=${song.videoId}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleCopy = (song: SongMetadata) => {
    if (song.lyrics) {
      navigator.clipboard.writeText(song.lyrics);
      handleToast('Lyrics copied to clipboard! ✨');
    }
  };

  const handlePullToRefresh = async () => {
    setPage(1);
    setTrending([]);
    setIsSearching(true);
    const data = await geminiService.getTrendingSongs(1);
    setTrending(data);
    setIsSearching(false);
    handleToast('Refreshed! 🎵');
  };

  // Progress states
  const [played, setPlayed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [seeking, setSeeking] = useState(false);
  
  const playerRef = useRef<any>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const observer = useRef<IntersectionObserver | null>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleProgress = (state: { played: number }) => {
    if (!seeking) {
      setPlayed(state.played);
    }
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPlayed(parseFloat(e.target.value));
  };

  const handleSeekMouseDown = () => {
    setSeeking(true);
  };

  const handleSeekMouseUp = (e: React.MouseEvent<HTMLInputElement> | React.TouchEvent<HTMLInputElement>) => {
    setSeeking(false);
    playerRef.current?.seekTo(parseFloat((e.target as HTMLInputElement).value));
  };

  // Infinite Scroll Trigger
  const lastElementRef = useCallback((node: HTMLDivElement | null) => {
    if (isSearching) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && view === 'trending' && !searchQuery) {
        setPage(prev => prev + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [isSearching, hasMore, view, searchQuery]);

  // Initial Load & Infinite Scroll
  useEffect(() => {
    async function loadMore() {
      if (view !== 'trending' || searchQuery) return;
      setIsLoadingMore(true);
      const data = await geminiService.getTrendingSongs(page);
      if (data.length === 0) setHasMore(false);
      else setTrending(prev => [...prev, ...data]);
      setIsLoadingMore(false);
    }
    loadMore();
  }, [page, view, searchQuery]);

  // Handle Search & Filter
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      const results = await geminiService.searchSongs(searchQuery, 1);
      setSearchResults(results);
      setIsSearching(false);
      addToHistory(searchQuery);
    }, 800);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery]);

  useEffect(() => {
    if (filter === 'Trending') {
      setSearchQuery('');
    } else {
      setSearchQuery(`Latest ${filter} Music 2025`);
    }
  }, [filter]);

  const handleOpenLyrics = async (song: SongMetadata) => {
    setSelectedSong(song);
    setLyrics(null);
    setIsLoadingLyrics(true);
    
    // If different song is opened, we don't auto-stop background play 
    // but the modal will allow playing the new song
    
    try {
      const fetchedLyrics = await geminiService.getLyrics(song.name, song.artist);
      setLyrics(fetchedLyrics);
      setSelectedSong({ ...song, lyrics: fetchedLyrics });
    } catch (error) {
      setLyrics("Error loading lyrics. Please try again.");
    } finally {
      setIsLoadingLyrics(false);
    }
  };

  const toggleSave = (song: SongMetadata) => {
    const isSaved = savedSongs.some(s => s.id === song.id);
    const updated = isSaved 
      ? savedSongs.filter(s => s.id !== song.id)
      : [...savedSongs, song];
    setSavedSongs(updated);
    localStorage.setItem('lyrics_hub_saved', JSON.stringify(updated));
  };

  const onPlaySong = (song: SongMetadata) => {
    if (activeSong?.id === song.id) {
      setIsPlaying(!isPlaying);
    } else {
      setPlayed(0);
      setDuration(0);
      setActiveSong(song);
      setIsPlaying(true);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-[#020617] text-slate-200 overflow-hidden font-sans">
      {/* Dynamic Mesh Background */}
      <div className="fixed inset-0 -z-20 bg-[#020617]" />
      <AnimatePresence>
        {activeSong && (
          <motion.div
            key={activeSong.videoId}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="fixed inset-0 -z-10 blur-[150px] opacity-30"
            style={{
              background: `radial-gradient(circle at 70% 30%, #38bdf8, transparent),
                           radial-gradient(circle at 30% 70%, #2563eb, transparent)`
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showToast && <Toast message={showToast} />}
      </AnimatePresence>
      {/* Hidden Player Background */}
      {activeSong && (
        <Player
          ref={playerRef}
          url={`https://www.youtube.com/watch?v=${activeSong.videoId}`}
          playing={isPlaying}
          volume={1}
          width="0"
          height="0"
          onProgress={handleProgress as any}
          onDuration={(d: number) => setDuration(d)}
          style={{ position: 'fixed', top: '-9999px' }}
          config={{
            youtube: {
              playerVars: { autoplay: 1, controls: 0, rel: 0 }
            }
          } as any}
        />
      )}

      {/* Mini Player */}
      <AnimatePresence>
        {activeSong && !selectedSong && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-[72px] md:bottom-6 left-4 right-4 md:left-auto md:right-8 md:w-96 z-40"
          >
            <div 
              onClick={() => setSelectedSong(activeSong)}
              className="bg-[#1e293b]/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-3 flex items-center gap-4 shadow-2xl cursor-pointer group"
            >
              <div className="relative w-12 h-12 shrink-0 rounded-lg overflow-hidden">
                <img 
                  src={activeSong.image} 
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (target.src.includes('hqdefault')) {
                      target.src = target.src.replace('hqdefault', 'mqdefault');
                    } else if (target.src.includes('mqdefault')) {
                      target.src = target.src.replace('mqdefault', 'default');
                    }
                  }}
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer"
                />
                {isPlaying && (
                   <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <div className="flex gap-0.5 items-end h-3">
                         <div className="w-0.5 bg-[#38bdf8] animate-[bounce_0.6s_ease-in-out_infinite]" />
                         <div className="w-0.5 bg-[#38bdf8] animate-[bounce_0.8s_ease-in-out_infinite]" />
                         <div className="w-0.5 bg-[#38bdf8] animate-[bounce_0.5s_ease-in-out_infinite]" />
                      </div>
                   </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-black truncate text-white">{activeSong.name}</h4>
                <div className="flex flex-col gap-1">
                  <p className="text-[10px] text-slate-400 font-bold uppercase truncate">{activeSong.artist}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#38bdf8] transition-all duration-300" 
                        style={{ width: `${played * 100}%` }}
                      />
                    </div>
                    <span className="text-[9px] text-slate-500 font-black tabular-nums">{formatTime(played * duration)}</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); setIsPlaying(!isPlaying); }}
                className="w-10 h-10 bg-[#38bdf8] text-white rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-90"
              >
                {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); setActiveSong(null); setIsPlaying(false); }}
                className="p-2 text-slate-500 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* desktop sidebar */}
      <aside className="hidden md:flex w-64 bg-[#0f172a] border-r border-slate-800 flex-col p-6 shrink-0 z-20">
        <div className="flex items-center gap-3 mb-10 cursor-pointer" onClick={() => { setView('trending'); setSearchQuery(''); }}>
          <div className="w-8 h-8 bg-[#38bdf8] rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-[#38bdf8]/30">L</div>
          <span className="text-xl font-bold tracking-tight text-white">LyricsHub</span>
        </div>
        
        <nav className="space-y-6 text-sm">
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-black mb-4 px-2">Library</p>
            <button 
              onClick={() => { setView('trending'); setSearchQuery(''); }}
              className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all font-semibold ${view === 'trending' ? 'bg-[#38bdf8]/10 text-[#38bdf8]' : 'hover:bg-white/5 text-slate-400'}`}
            >
              <TrendingUp size={18} /> New Releases
            </button>
            <button 
              onClick={() => { setView('saved'); setSearchQuery(''); }}
              className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all font-semibold ${view === 'saved' ? 'bg-[#38bdf8]/10 text-[#38bdf8]' : 'hover:bg-white/5 text-slate-400'}`}
            >
              <Heart size={18} /> My Library
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#020617] relative">
        <header className="px-4 py-4 md:px-8 md:py-6 flex items-center justify-between z-10 bg-[#020617]/90 backdrop-blur-xl sticky top-0 md:relative border-b border-white/[0.03]">
          <div className="md:hidden w-8 h-8 bg-[#38bdf8] rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-[#38bdf8]/30 shrink-0">L</div>
          
          <div className="flex-1 max-w-xl mx-4 relative">
            <input 
              type="text"
              placeholder="Search Latest Songs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/[0.05] rounded-2xl py-3 pl-11 pr-4 text-sm focus:border-[#38bdf8]/50 focus:bg-white/[0.05] outline-none transition-all placeholder:text-slate-600"
            />
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          </div>

          <div className="hidden sm:flex items-center gap-3">
             <div className="w-10 h-10 rounded-2xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center">
                <Music size={16} className="text-slate-400" />
             </div>
          </div>
        </header>

        {/* Content Section */}
        <section className="flex-1 px-4 md:px-8 py-6 md:py-8 overflow-y-auto custom-scrollbar overflow-x-hidden relative">
          {/* Background Glows */}
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#38bdf8]/5 blur-[120px] -z-10 rounded-full" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] -z-10 rounded-full" />

          {history.length > 0 && !searchQuery && (
            <div className="mb-10 px-2 animate-in fade-in slide-in-from-top-4 duration-500">
              <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] mb-4">Past Explorations</p>
              <div className="flex flex-wrap gap-2">
                {history.map(h => (
                  <button 
                    key={h}
                    onClick={() => setSearchQuery(h)}
                    className="px-4 py-2 bg-white/[0.03] border border-white/[0.05] rounded-xl text-xs text-slate-300 hover:bg-[#38bdf8]/10 hover:text-[#38bdf8] transition-all hover:border-[#38bdf8]/20"
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Top Filters */}
          <div className="flex items-center gap-3 mb-6 overflow-x-auto pb-2 custom-scrollbar pr-10">
            {filters.map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-5 py-2.5 rounded-full text-xs font-black tracking-widest uppercase transition-all shrink-0 border ${filter === f ? 'bg-[#38bdf8] border-[#38bdf8] text-black shadow-[0_0_20px_rgba(56,189,248,0.3)]' : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:border-white/10'}`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-4">
              {searchQuery ? `Fresh Results` : view === 'trending' ? filter : 'Saved for Later'}
              <button onClick={handlePullToRefresh} className="p-2 rounded-full hover:bg-white/5 transition-colors">
                <RefreshCcw size={18} className={isSearching ? 'animate-spin' : ''} />
              </button>
            </h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6 md:gap-8 pb-24 md:pb-12">
            {isSearching ? (
              [...Array(12)].map((_, i) => <SkeletonCard key={i} />)
            ) : (
              (searchQuery ? searchResults : view === 'trending' ? trending : savedSongs).map((song, i, arr) => (
                <div key={song.id} ref={i === arr.length - 1 ? lastElementRef : null}>
                  <SongCard 
                    song={song} 
                    isSaved={savedSongs.some(s => s.id === song.id)}
                    onToggleSave={() => toggleSave(song)}
                    onClick={() => handleOpenLyrics(song)} 
                  />
                </div>
              ))
            )}
            
            {isLoadingMore && !isSearching && [...Array(6)].map((_, i) => <SkeletonCard key={`more-${i}`} />)}
          </div>
        </section>

        {/* Mobile Nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0f172a]/95 backdrop-blur-xl border-t border-white/[0.05] flex justify-around p-4 z-40">
          <button onClick={() => setView('trending')} className={`flex flex-col items-center gap-1.5 transition-colors ${view === 'trending' ? 'text-[#38bdf8]' : 'text-slate-500'}`}>
            <LayoutDashboard size={22} />
            <span className="text-[10px] font-black uppercase tracking-widest">Home</span>
          </button>
          <button onClick={() => setView('saved')} className={`flex flex-col items-center gap-1.5 transition-colors ${view === 'saved' ? 'text-[#38bdf8]' : 'text-slate-500'}`}>
            <HistoryIcon size={22} />
            <span className="text-[10px] font-black uppercase tracking-widest">Saved</span>
          </button>
        </nav>
      </main>

      {/* Lyrics Modal with YouTube Player */}
      <AnimatePresence>
        {selectedSong && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-8 lg:p-12"
          >
            <div className="absolute inset-0 bg-black/98" onClick={() => setSelectedSong(null)} />
            
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="relative w-full h-full md:max-w-6xl md:max-h-[85vh] md:rounded-[48px] bg-[#020617] md:border border-white/[0.05] overflow-hidden flex flex-col md:flex-row shadow-2xl"
            >
              {/* Player / Image Side */}
              <div className="w-full md:w-[450px] lg:w-[500px] h-[300px] md:h-full relative shrink-0 overflow-hidden">
                <img 
                  src={selectedSong.image} 
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (target.src.includes('hqdefault')) {
                      target.src = target.src.replace('hqdefault', 'mqdefault');
                    } else if (target.src.includes('mqdefault')) {
                      target.src = target.src.replace('mqdefault', 'default');
                    }
                  }}
                  className="absolute inset-0 w-full h-full object-cover scale-150 blur-3xl opacity-40" 
                  referrerPolicy="no-referrer"
                />
                
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-gradient-to-t from-[#020617] via-transparent to-[#020617]/40">
                   <motion.div
                    animate={isPlaying && activeSong?.id === selectedSong.id ? { rotate: 360 } : { rotate: 0 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="mb-8 relative"
                   >
                      <div className="absolute inset-0 bg-[#38bdf8]/20 blur-3xl rounded-full animate-pulse" />
                      <div className="relative p-1.5 rounded-full bg-gradient-to-tr from-[#38bdf8] via-blue-500 to-purple-600 shadow-2xl">
                        <img 
                          src={selectedSong.image} 
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (target.src.includes('hqdefault')) {
                              target.src = target.src.replace('hqdefault', 'mqdefault');
                            } else if (target.src.includes('mqdefault')) {
                              target.src = target.src.replace('mqdefault', 'default');
                            }
                          }}
                          className="w-48 h-48 rounded-full object-cover border-4 border-[#020617]" 
                          referrerPolicy="no-referrer"
                        />
                      </div>
                   </motion.div>

                   <button 
                    onClick={() => onPlaySong(selectedSong)}
                    className="w-24 h-24 bg-[#38bdf8] text-white rounded-full flex items-center justify-center shadow-2xl shadow-[#38bdf8]/40 hover:scale-110 active:scale-95 transition-all mb-8 group z-10"
                   >
                     {isPlaying && activeSong?.id === selectedSong.id ? <Pause size={38} fill="currentColor" /> : <Play size={38} fill="currentColor" className="ml-1.5" />}
                   </button>
                   <h3 className="text-3xl md:text-4xl font-black text-white mb-2 leading-tight px-4 italic tracking-tight">{selectedSong.name}</h3>
                   <p className="text-sm md:text-base text-[#38bdf8] font-black uppercase tracking-[0.2em] mb-10">{selectedSong.artist}</p>

                  {/* Actions */}
                  <div className="flex items-center gap-4 mb-10">
                     <button 
                      onClick={() => handleCopy(selectedSong)}
                      className="flex-1 h-14 rounded-2xl bg-white/5 hover:bg-white/10 transition-all flex items-center justify-center gap-3 border border-white/5 font-bold"
                     >
                       <Copy size={20} /> Copy
                     </button>
                     <button 
                      onClick={() => handleShare(selectedSong)}
                      className="flex-1 h-14 rounded-2xl bg-[#25D366]/10 hover:bg-[#25D366]/20 transition-all flex items-center justify-center gap-3 border border-[#25D366]/20 text-[#25D366] font-bold"
                     >
                       <Share2 size={20} /> Share
                     </button>
                  </div>
                </div>
                
                {/* Back button for mobile */}
                <button 
                  onClick={() => setSelectedSong(null)} 
                  className="absolute top-4 left-4 z-40 p-2.5 bg-black/40 backdrop-blur-xl rounded-full text-white border border-white/10"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Lyrics Content Side */}
              <div className="flex-1 flex flex-col min-h-0 bg-[#020617]">
                 <div className="p-6 md:p-8 flex items-center justify-between border-b border-white/[0.03] shrink-0 sticky top-0 bg-[#020617]/90 backdrop-blur-md z-10">
                   <div className="flex items-center gap-3">
                     <div className="px-3 py-1 bg-[#38bdf8]/10 border border-[#38bdf8]/20 rounded-lg">
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#38bdf8]">Lipi: Romanized</span>
                     </div>
                   </div>
                   <div className="flex items-center gap-6">
                     <button onClick={() => toggleSave(selectedSong)} className="text-slate-400 hover:text-red-500 transition-all active:scale-125">
                        <Heart size={20} fill={savedSongs.some(s => s.id === selectedSong.id) ? "#ef4444" : "none"} className={savedSongs.some(s => s.id === selectedSong.id) ? "text-red-500" : ""} />
                     </button>
                     <button onClick={() => setSelectedSong(null)} className="hidden md:block text-slate-400 hover:text-white transition-colors">
                        <X size={24} />
                     </button>
                   </div>
                 </div>

                 <div className="flex-1 px-6 py-8 md:px-12 md:py-10 overflow-y-auto custom-scrollbar">
                    {isLoadingLyrics ? (
                      <div className="h-full flex flex-col items-center justify-center gap-6">
                        <Loader2 className="w-10 h-10 animate-spin text-[#38bdf8]" />
                        <span className="text-[11px] uppercase font-black tracking-[0.3em] text-slate-700">Syncing Lyrics...</span>
                      </div>
                    ) : (
                      <div className="max-w-2xl mx-auto space-y-4 pb-12">
                         {lyrics?.split('\n').map((line, i) => (
                           <p key={i} className="text-lg md:text-xl font-bold text-slate-300 hover:text-white transition-all cursor-default border-l-4 border-transparent hover:border-[#38bdf8]/50 pl-6 py-1 leading-relaxed">
                            {line || <br />}
                           </p>
                         ))}
                      </div>
                    )}
                 </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
