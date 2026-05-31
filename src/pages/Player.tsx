import { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowLeft, ArrowRight, Play, Pause, Maximize, Volume2, VolumeX, Settings, AlertCircle } from "lucide-react";
import { BackgroundTheme } from "../components/BackgroundTheme";
import { MOVIES_DATA } from "../data/movies";

export default function Player() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(120 * 60); // default to 120min
  const [isHovering, setIsHovering] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [activeServer, setActiveServer] = useState(1);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);

  const movie = MOVIES_DATA.find((m) => m.id === id);
  const similarMovies = movie ? MOVIES_DATA.filter(m => m.categorySlug === movie.categorySlug && m.id !== movie.id).slice(0, 10) : [];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!movie?.videoUrl) {
      if (isPlaying) {
        const interval = setInterval(() => {
          setProgress(p => {
            if (p >= 100) {
              setIsPlaying(false);
              return 100;
            }
            return p + 0.1;
          });
        }, 100);
        return () => clearInterval(interval);
      }
    }
  }, [isPlaying, movie]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = volume === 0 || isMuted;
    }
  }, [volume, isMuted]);

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
      if (total > 0) {
        setProgress((current / total) * 100);
        setDuration(total);
      }
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    // Use offsetX from ltr container, but since it has dir="rtl" or "ltr" we must be careful.
    // The parent has dir="rtl" but the container is generic, let's use clientX.
    // The closest container has dir="rtl" so left is left.
    // Let's force controls to ltr or handle purely by rect pos.
    // Actually, in RTL, rect.left is still the visual left of the screen.
    const isRtl = document.dir === 'rtl';
    const percent = isRtl
        ? (rect.right - e.clientX) / rect.width
        : (e.clientX - rect.left) / rect.width;
    
    // Fallback if not RTL:
    const pos = (e.clientX - rect.left) / rect.width;

    const finalPercent = document.dir === 'rtl' ? pos : pos; // Wait, boundingBox is absolute. In both RTL and LTR, e.clientX - rect.left is distance from left edge!
    
    // If the progress bar fills from left to right, we just use from left edge.
    // Let's let the fill be LTR for progress.
    let newProgress = pos * 100;
    if (newProgress < 0) newProgress = 0;
    if (newProgress > 100) newProgress = 100;

    setProgress(newProgress);

    if (videoRef.current && duration > 0) {
      videoRef.current.currentTime = (newProgress / 100) * duration;
    }
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

  if (!movie) {
    return (
      <BackgroundTheme>
        <div className="min-h-screen flex items-center justify-center text-white flex-col gap-4">
          <AlertCircle className="w-16 h-16 text-orange-500" />
          <h1 className="text-2xl font-black">الفيلم غير موجود</h1>
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
          
          {/* Movie Details Above Player */}
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
                  <img src={movie.image} alt={movie.title} className="w-full h-full object-cover" />
                </div>

                {/* Title and Tags */}
                <div className="flex flex-col items-start gap-2 sm:gap-4 flex-1">
                  <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white leading-tight drop-shadow-md">
                    {movie.title}
                  </h1>

                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 sm:px-4 py-0.5 sm:py-1 text-[10px] sm:text-sm font-bold bg-white/10 text-white rounded-full backdrop-blur-md border border-white/5">{movie.category}</span>
                      <span className="px-2 sm:px-4 py-0.5 sm:py-1 text-[10px] sm:text-sm font-bold bg-white/10 text-white rounded-full backdrop-blur-md border border-white/5">{movie.year}</span>
                    </div>
                    {movie.duration && (
                      <span className="px-2 sm:px-4 py-0.5 sm:py-1 text-[10px] sm:text-sm font-bold bg-white/10 text-white rounded-full backdrop-blur-md border border-white/5 w-fit">{movie.duration}</span>
                    )}
                    <span className="px-2 sm:px-4 py-0.5 sm:py-1 text-[10px] sm:text-sm font-bold bg-cyan-900/40 text-cyan-400 rounded-full backdrop-blur-md border border-cyan-500/20 flex items-center gap-1.5 w-fit">
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                      {movie.rating} / 10
                    </span>
                  </div>
                </div>
              </div>

              {/* Description entirely below image & meta */}
              <div className="text-gray-300 w-full mt-1 sm:mt-2">
                <p className="text-xs sm:text-base leading-relaxed sm:leading-loose text-white/80 max-w-4xl">
                  {movie.description || "عالم لا حدود له من المتعة والإثارة."}
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
            {!movie.videoUrl && (
              <div 
                className={`absolute inset-0 bg-cover bg-center transition-all duration-1000 ${isPlaying ? 'scale-105 opacity-80' : 'scale-100 opacity-50 blur-sm'}`}
                style={{ backgroundImage: `url(${movie.image})` }}
              />
            )}
            
            {/* Native Video Element */}
            {movie.videoUrl && (
              <video
                ref={videoRef}
                src={movie.videoUrl}
                className="absolute inset-0 w-full h-full object-cover"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                onWaiting={() => setIsBuffering(true)}
                onPlaying={() => { setIsBuffering(false); setIsPlaying(true); }}
                onPause={() => setIsPlaying(false)}
                onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                playsInline
              />
            )}

            {isPlaying && !movie.videoUrl && (
              <div className="absolute inset-0 bg-black/20" />
            )}

            {/* Play overlay when paused */}
            <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${isPlaying ? 'opacity-0' : 'opacity-100 bg-black/40 backdrop-blur-sm'}`}>
              <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full border border-orange-500/50 bg-orange-500/20 text-white flex items-center justify-center hover:scale-110 transition-transform cursor-pointer drop-shadow-[0_0_20px_rgba(249,115,22,0.4)]">
                <Play className="w-6 h-6 sm:w-8 sm:h-8 ml-1 sm:ml-2 fill-current drop-shadow-lg" />
              </div>
            </div>

            {/* Simulated Live Stream Buffer Ring */}
            {(isBuffering || (isPlaying && progress === 0 && !movie.videoUrl)) && (
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

          {/* Similar Movies */}
          {similarMovies.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-8 sm:mt-12 mb-8"
            >
              <h2 className="text-xl sm:text-2xl font-black text-white mb-6 pr-4 border-r-4 border-cyan-500">
                قد ترغب في مشاهدة أيضاً
              </h2>
              <div className="flex overflow-x-auto gap-4 pb-6 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {similarMovies.map((m) => (
                  <Link 
                    to={`/player/${m.id}`} 
                    key={m.id} 
                    className="flex-none w-32 sm:w-40 md:w-48 aspect-[2/3] rounded-xl overflow-hidden shadow-lg border border-white/10 relative group snap-start"
                  >
                    <img src={m.image} alt={m.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3 sm:p-4">
                      <h3 className="text-white font-bold text-sm sm:text-base mb-1 truncate">{m.title}</h3>
                      <div className="flex items-center gap-2 text-xs text-white/80">
                        <span className="bg-white/20 px-2 py-0.5 rounded backdrop-blur-sm">{m.year}</span>
                        <span className="flex items-center gap-1 text-cyan-400 bg-black/40 px-2 py-0.5 rounded backdrop-blur-sm">
                          <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> 
                          {m.rating}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </BackgroundTheme>
  );
}
