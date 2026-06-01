import { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowLeft, ArrowRight, Play, Pause, Maximize, Volume2, VolumeX, Settings, AlertCircle, Eye, CheckCircle2 } from "lucide-react";
import { BackgroundTheme } from "../components/BackgroundTheme";
import { SERIES_DATA } from "../data/series";
import { useAuth } from "../contexts/AuthContext";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

export default function SeriesPlayer() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(120 * 60);
  const [isHovering, setIsHovering] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [activeServer, setActiveServer] = useState(1);
  const [activeSeason, setActiveSeason] = useState(1);
  const [activeEpisode, setActiveEpisode] = useState(1);
  
  const [episodeProgressMap, setEpisodeProgressMap] = useState<Record<string, { progress: number; completed: boolean }>>({});
  const lastSavedProgressRef = useRef(0);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);

  const series = SERIES_DATA.find((m) => m.id === id);
  const similarSeries = series ? SERIES_DATA.filter(m => m.id !== series.id).slice(0, 10) : [];
  
  const currentSeasonData = series?.seasons?.find(s => s.seasonNumber === activeSeason);
  const currentEpisodeData = currentSeasonData?.episodes?.find(e => e.episodeNumber === activeEpisode);

  // Load progress history from Firebase if logged in
  useEffect(() => {
    if (!series) return;
    
    // Clear state initially so each user gets a fresh start (or when logged out)
    setEpisodeProgressMap({});
    setActiveSeason(1);
    setActiveEpisode(1);
    setProgress(0);
    setHasSetInitialTime(false);
    lastSavedProgressRef.current = 0;

    const loadProgress = async () => {
      // If user is logged in, overwrite with their sync data
      if (currentUser) {
        try {
          const docRef = doc(db, "users", currentUser.uid, "seriesProgress", series.id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
             const data = docSnap.data();
             if (data.episodes) {
               setEpisodeProgressMap(data.episodes);
             }
             if (data.lastSeason && data.lastEpisode) {
               setActiveSeason(data.lastSeason);
               setActiveEpisode(data.lastEpisode);
             }
          }
        } catch (err) {
          console.error("Error loading progress from firestore", err);
        }
      }
    };

    loadProgress();
  }, [series, currentUser]);

  const updateProgressState = (newProg: number) => {
    if (!series) return;
    
    const key = `S${activeSeason}E${activeEpisode}`;
    
    setEpisodeProgressMap(prev => {
      const prevData = prev[key] || { progress: 0, completed: false };
      const isCompletedNow = newProg >= 95 || prevData.completed;
      
      const updated = { 
        ...prev, 
        [key]: { progress: newProg, completed: isCompletedNow } 
      };
      
      // Save directly to firestore if logged in, completely ignoring local storage memory.
      if (currentUser) {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => {
           setDoc(doc(db, "users", currentUser.uid, "seriesProgress", series.id), {
             seriesId: series.id,
             lastSeason: activeSeason,
             lastEpisode: activeEpisode,
             updatedAt: new Date().toISOString(),
             episodes: updated
           }, { merge: true }).catch(err => console.error("Error saving progress to firestore", err));
        }, 2000); // 2 second debounce
      }
      
      return updated;
    });
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!currentEpisodeData?.videoUrl) {
      if (isPlaying) {
        const interval = setInterval(() => {
          setProgress(p => {
            const nextP = p >= 100 ? 100 : p + 0.1;
            if (nextP === 100) setIsPlaying(false);
            
            // save dummy progress
            if (Math.abs(nextP - lastSavedProgressRef.current) > 2) {
               lastSavedProgressRef.current = nextP;
               updateProgressState(nextP);
            }
            return nextP;
          });
        }, 100);
        return () => clearInterval(interval);
      }
    }
  }, [isPlaying, currentEpisodeData, activeSeason, activeEpisode, series?.id]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = volume === 0 || isMuted;
    }
  }, [volume, isMuted, currentEpisodeData]);

  // Set initial video time if we have saved progress
  const [hasSetInitialTime, setHasSetInitialTime] = useState(false);
  useEffect(() => {
    setHasSetInitialTime(false);
    setProgress(0);
    lastSavedProgressRef.current = 0;
  }, [activeEpisode, activeSeason]);

  const handleVolumeChange = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    let newVolume = pos;
    if (newVolume < 0) newVolume = 0;
    if (newVolume > 1) newVolume = 1;
    setVolume(newVolume);
    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const total = videoRef.current.duration;
      
      // Auto-seek to saved progress on first load
      if (!hasSetInitialTime && total > 0) {
         setHasSetInitialTime(true);
         const key = `S${activeSeason}E${activeEpisode}`;
         const savedData = episodeProgressMap[key];
         const savedProg = savedData ? savedData.progress : 0;
         if (savedProg > 0 && savedProg < 98) {
            videoRef.current.currentTime = (savedProg / 100) * total;
            return;
         }
      }

      if (total > 0) {
        const p = (current / total) * 100;
        setProgress(p);
        setDuration(total);

        if (Math.abs(p - lastSavedProgressRef.current) > 1) {
          lastSavedProgressRef.current = p;
          updateProgressState(p);
        }
      }
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;

    let newProgress = pos * 100;
    if (newProgress < 0) newProgress = 0;
    if (newProgress > 100) newProgress = 100;

    setProgress(newProgress);

    if (videoRef.current && duration > 0) {
      videoRef.current.currentTime = (newProgress / 100) * duration;
    }
    
    lastSavedProgressRef.current = newProgress;
    updateProgressState(newProgress);
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      playerContainerRef.current?.requestFullscreen().catch(err => {
        console.log(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen().catch(err => {
        console.log(`Error attempting to exit fullscreen: ${err.message}`);
      });
    }
  };

  const formatTime = (secondsTotal: number) => {
    const m = Math.floor(secondsTotal / 60);
    const s = Math.floor(secondsTotal % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getCurrentFormattedTime = () => {
    return formatTime((progress / 100) * duration);
  };

  const handleMouseMove = () => {
    setIsHovering(true);
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setIsHovering(false);
    }, 3000);
  };

  if (!series) {
    return (
      <BackgroundTheme>
        <div className="min-h-screen flex items-center justify-center text-white flex-col gap-4">
          <AlertCircle className="w-16 h-16 text-orange-500" />
          <h1 className="text-2xl font-black">المسلسل غير موجود</h1>
          <button onClick={() => navigate(-1)} className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors border border-white/10">العودة</button>
        </div>
      </BackgroundTheme>
    );
  }

  return (
    <BackgroundTheme>
      <div className="min-h-screen pb-20 max-w-[100vw] overflow-x-hidden" dir="rtl">
        {/* Navigation */}
        <nav className="w-full bg-black/50 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-transparent to-orange-500/10 pointer-events-none" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between relative z-10">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate(-1)}
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors border border-white/5"
              >
                <ArrowRight className="w-5 h-5 text-gray-300" />
              </button>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-xl font-black tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white to-orange-400">
                Alpha
              </span>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-0 sm:px-6 lg:px-8 mt-0 sm:mt-8">
          
          {/* Series Details Above Player */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-4 sm:mb-8 p-4 sm:p-6 bg-black/40 backdrop-blur-md rounded-none sm:rounded-2xl border-b sm:border border-white/5 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-3xl rounded-full" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-orange-500/10 blur-3xl rounded-full" />
            
            <div className="relative z-10 flex flex-col gap-4 sm:gap-8">
              <div className="flex flex-row items-center gap-4 sm:gap-6">
                
                {/* Poster Image */}
                <div className="w-24 sm:w-40 flex-shrink-0 aspect-[2/3] rounded-xl overflow-hidden shadow-xl border border-white/10">
                  <img src={series.image} alt={series.title} className="w-full h-full object-cover" />
                </div>

                {/* Title and Tags */}
                <div className="flex flex-col items-start gap-2 sm:gap-4 flex-1">
                  <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white leading-tight drop-shadow-md">
                    {series.title}
                  </h1>

                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 sm:px-4 py-0.5 sm:py-1 text-[10px] sm:text-sm font-bold bg-white/10 text-white rounded-full backdrop-blur-md border border-white/5">{series.category}</span>
                      <span className="px-2 sm:px-4 py-0.5 sm:py-1 text-[10px] sm:text-sm font-bold bg-white/10 text-white rounded-full backdrop-blur-md border border-white/5">{series.year}</span>
                    </div>
                    {currentEpisodeData?.duration && (
                      <span className="px-2 sm:px-4 py-0.5 sm:py-1 text-[10px] sm:text-sm font-bold bg-white/10 text-white rounded-full backdrop-blur-md border border-white/5 w-fit">الموسم {activeSeason} | {currentEpisodeData.title}</span>
                    )}
                    <span className="px-2 sm:px-4 py-0.5 sm:py-1 text-[10px] sm:text-sm font-bold bg-cyan-900/40 text-cyan-400 rounded-full backdrop-blur-md border border-cyan-500/20 flex items-center gap-1.5 w-fit">
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                      {series.rating} / 10
                    </span>
                  </div>
                </div>
              </div>

              {/* Description entirely below image & meta */}
              <div className="text-gray-300 w-full mt-1 sm:mt-2">
                <p className="text-xs sm:text-base leading-relaxed sm:leading-loose text-white/80 max-w-4xl">
                  {series.description || "عالم لا حدود له من المتعة والإثارة."}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Custom Cinematic Player UI */}
          <motion.div 
            ref={playerContainerRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full relative mx-auto aspect-video max-h-[40vh] sm:max-h-none sm:aspect-video bg-black sm:rounded-2xl overflow-hidden shadow-2xl border-0 sm:border border-white/10 group cursor-default flex items-center justify-center"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => isPlaying && setIsHovering(false)}
            onClick={togglePlay}
          >
            {/* Background Image / Fake Video Stream (Fallback) */}
            {!currentEpisodeData?.videoUrl && (
              <div 
                className={`absolute inset-0 bg-cover bg-center transition-all duration-1000 ${isPlaying ? 'scale-105 opacity-80' : 'scale-100 opacity-50 blur-sm'}`}
                style={{ backgroundImage: `url(${currentEpisodeData?.image || series.image})` }}
              />
            )}
            
            {/* Native Video Element */}
            {currentEpisodeData?.videoUrl && (
              <video
                key={currentEpisodeData.videoUrl}
                ref={videoRef}
                src={currentEpisodeData.videoUrl}
                className="absolute inset-0 w-full h-full object-cover"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                onWaiting={() => setIsBuffering(true)}
                onPlaying={() => { setIsBuffering(false); setIsPlaying(true); }}
                onPause={() => setIsPlaying(false)}
                onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                playsInline
                autoPlay={isPlaying}
              />
            )}

            {isPlaying && !currentEpisodeData?.videoUrl && (
              <div className="absolute inset-0 bg-black/20" />
            )}

            {/* Play overlay when paused */}
            <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${isPlaying ? 'opacity-0' : 'opacity-100 bg-black/40 backdrop-blur-sm'}`}>
              <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full border border-orange-500/50 bg-orange-500/20 text-white flex items-center justify-center hover:scale-110 transition-transform cursor-pointer drop-shadow-[0_0_20px_rgba(249,115,22,0.4)]">
                <Play className="w-6 h-6 sm:w-8 sm:h-8 ml-1 sm:ml-2 fill-current drop-shadow-lg" />
              </div>
            </div>

            {/* Simulated Live Stream Buffer Ring */}
            {(isBuffering || (isPlaying && progress === 0 && !currentEpisodeData?.videoUrl)) && (
               <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                 <div className="w-14 h-14 border-4 border-white/20 border-t-cyan-400 rounded-full animate-spin shadow-[0_0_15px_rgba(34,211,238,0.5)]" />
               </div>
            )}

            {/* Player Controls Panel */}
            <div 
              onClick={(e) => e.stopPropagation()}
              className={`absolute bottom-0 left-0 right-0 p-4 pt-16 bg-gradient-to-t from-black via-black/80 to-transparent transition-opacity duration-300 ${isHovering || !isPlaying ? 'opacity-100' : 'opacity-0'}`}
              dir="ltr"
            >
              {/* Progress Bar */}
              <div 
                className="w-full group/progress cursor-pointer h-2 relative mb-4"
                onClick={handleSeek}
              >
                <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-1 bg-white/20 rounded-full transition-all group-hover/progress:h-1.5" />
                <div 
                  className="absolute top-1/2 -translate-y-1/2 left-0 h-1 bg-gradient-to-r from-cyan-500 to-orange-500 rounded-full transition-all group-hover/progress:h-1.5"
                  style={{ width: `${progress}%` }}
                />
                <div 
                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,1)] opacity-0 group-hover/progress:opacity-100 transition-opacity"
                  style={{ left: `calc(${progress}% - 6px)` }}
                />
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between" dir="ltr">
                
                {/* Left Side Controls */}
                <div className="flex items-center gap-2 sm:gap-4">
                  <button onClick={togglePlay} className="text-white hover:text-cyan-400 transition-colors">
                    {isPlaying ? <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-current" /> : <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />}
                  </button>
                  <div className="relative group/vol flex items-center">
                    <button onClick={toggleMute} className="text-white hover:text-cyan-400 transition-colors py-1 px-1 z-10 shrink-0 flex items-center justify-center">
                      {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" /> : <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />}
                    </button>
                    <div className="w-0 overflow-hidden group-hover/vol:w-16 sm:group-hover/vol:w-20 transition-all duration-300 flex items-center opacity-0 group-hover/vol:opacity-100 h-6">
                      <div 
                        className="w-[calc(100%-0.5rem)] ml-1 sm:ml-2 h-1 bg-white/30 rounded-full cursor-pointer relative"
                        onMouseDown={handleVolumeChange}
                        onMouseMove={(e) => { if (e.buttons === 1) handleVolumeChange(e) }}
                      >
                        <div className="absolute left-0 top-0 h-full bg-cyan-400 rounded-full pointer-events-none" style={{ width: `${(isMuted ? 0 : volume) * 100}%` }} />
                        <div className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full shadow-[0_0_8px_rgba(34,211,238,0.8)] pointer-events-none" style={{ left: `calc(${(isMuted ? 0 : volume) * 100}% - 5px)` }} />
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-[10px] sm:text-xs font-medium text-white/80 font-mono tracking-wider ml-1">
                    {getCurrentFormattedTime()} <span className="text-white/40">/</span> {formatTime(duration)}
                  </div>
                </div>

                {/* Right Side Controls */}
                <div className="flex items-center gap-3 sm:gap-4">
                  <button className="text-white hover:text-orange-400 transition-colors">
                    <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  <button onClick={toggleFullscreen} className="text-white hover:text-cyan-400 transition-colors">
                    <Maximize className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>

              </div>
            </div>
          </motion.div>

          {/* Server Selection Bar */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-2 sm:mt-4 flex flex-row items-center justify-between gap-1 sm:gap-3 w-full px-1 sm:px-0"
          >
            {[1, 2, 3, 4, 5].map((srv) => (
              <button
                key={srv}
                onClick={() => setActiveServer(srv)}
                disabled={srv !== 1}
                title={srv !== 1 ? "هذا المشغل لا يعمل حالياً" : "المشغل الافتراضي"}
                className={`flex-1 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-[10px] sm:text-sm font-bold transition-all border outline-none whitespace-nowrap text-center ${
                  activeServer === srv
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/10 border-cyan-500/50 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)]'
                    : 'bg-white/5 border-white/5 text-white/40 cursor-not-allowed opacity-75'
                }`}
              >
                مشغل {srv}
              </button>
            ))}
          </motion.div>

          {/* Sessions & Episodes Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 sm:mt-10 px-4 sm:px-0"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <div className="flex items-center gap-4 text-white font-bold">
                <span className="text-gray-400 text-sm">الموسم</span>
                <div className="flex gap-2">
                  {series.seasons?.map(s => (
                    <button 
                      key={s.seasonNumber}
                      onClick={() => setActiveSeason(s.seasonNumber)}
                      className={`text-lg transition-colors px-2 ${activeSeason === s.seasonNumber ? 'text-white border-b-2 border-white' : 'text-gray-500 hover:text-white'}`}
                    >
                      {s.seasonNumber}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 pb-4">
              {currentSeasonData?.episodes?.map(ep => {
                const epKey = `S${currentSeasonData.seasonNumber}E${ep.episodeNumber}`;
                const epData = episodeProgressMap[epKey];
                const epProgress = epData ? epData.progress : 0;
                const isCompleted = epData ? epData.completed : false;

                return (
                <button
                  key={ep.episodeNumber}
                  onClick={() => {
                    setActiveEpisode(ep.episodeNumber);
                    setIsPlaying(true); // force play when clicked
                  }}
                  className={`w-full aspect-[16/9] rounded-xl overflow-hidden relative group text-right transition-all duration-300 ${
                    activeEpisode === ep.episodeNumber 
                      ? 'ring-2 ring-white/20 shadow-[0_4px_20px_rgba(255,255,255,0.05)] opacity-100 scale-[1.02]'
                      : isCompleted ? 'opacity-70 hover:opacity-100' : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={ep.image} alt={ep.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-2 sm:p-3">
                    {activeEpisode === ep.episodeNumber ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px] gap-2">
                         <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
                         <span className="font-bold text-white tracking-widest text-xs sm:text-sm drop-shadow-md">تشاهد</span>
                      </div>
                    ) : isCompleted ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-cyan-900/40 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <CheckCircle2 className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
                      </div>
                    ) : null}
                    <div className="flex items-center justify-between relative z-10 w-full mb-1">
                      <span className="text-white font-bold text-xs sm:text-sm flex items-center gap-1.5">
                        {ep.title}
                        {isCompleted && activeEpisode !== ep.episodeNumber && <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-cyan-400" />}
                      </span>
                      <span className="text-gray-300 text-[10px] sm:text-xs font-mono">{ep.duration}</span>
                    </div>

                    {/* Progress Bar inside episode card */}
                    {epProgress > 0 && !isCompleted && (
                       <div className="absolute bottom-0 left-0 right-0 h-1 sm:h-1.5 bg-white/20">
                         <div className="h-full bg-gradient-to-r from-cyan-500 to-orange-500" style={{ width: `${epProgress}%` }} />
                       </div>
                    )}
                    {isCompleted && (
                       <div className="absolute bottom-0 left-0 right-0 h-1 sm:h-1.5 bg-cyan-500/80 shadow-[0_-2px_10px_rgba(34,211,238,0.3)]" />
                    )}
                  </div>
                </button>
              )})}
            </div>
          </motion.div>

        </div>
      </div>
    </BackgroundTheme>
  );
}
