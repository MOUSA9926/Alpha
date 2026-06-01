import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Shield, Swords, Trophy, Users, Zap, Target, PawPrint, Search, X, Play, ArrowLeft, Settings, Heart, Clock, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { WolfEye, BackgroundTheme } from "../components/BackgroundTheme";
import { MOVIES_DATA } from "../data/movies";
import { SERIES_DATA } from "../data/series";
import { useAuth } from "../contexts/AuthContext";
import { auth } from "../firebase";

const SeeMoreCard = ({ category, type = "movie" }: { category: string, type?: "movie" | "series" }) => {
  return (
    <Link 
      to={`/category/${encodeURIComponent(category)}`}
      className="flex-none w-32 sm:w-40 md:w-48 bg-black/40 border border-white/10 hover:border-white/30 backdrop-blur-md rounded-xl overflow-hidden transition-all duration-300 group flex flex-col snap-center sm:snap-start cursor-pointer focus:outline-none select-none items-center justify-center p-4 hover:bg-white/5"
    >
      <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
        <ArrowLeft className="w-6 h-6 text-white/70" />
      </div>
      <span className="text-white/80 font-bold group-hover:text-white transition-colors">المزيد</span>
    </Link>
  );
};

const DynamicMediaCard = ({ media, type }: { media: any, type: "movie" | "series" }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [ratio, setRatio] = useState(0.5);
  const navigate = useNavigate();

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const scrollContainer = card.closest('.scrollbar-hide');
    
    let isTicking = false;
    let reqId: number;
    const updateTheme = () => {
      if (!isTicking) {
        reqId = requestAnimationFrame(() => {
          if (!cardRef.current) return;
          const rect = cardRef.current.getBoundingClientRect();
          const cardCenter = rect.left + rect.width / 2;
          const windowWidth = window.innerWidth;
          
          let r = cardCenter / windowWidth;
          r = Math.max(0, Math.min(1, r));
          setRatio(r);
          isTicking = false;
        });
        isTicking = true;
      }
    };
    
    setTimeout(updateTheme, 50);
    
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', updateTheme, { passive: true });
    }
    window.addEventListener('resize', updateTheme, { passive: true });
    
    return () => {
      cancelAnimationFrame(reqId);
      if (scrollContainer) scrollContainer.removeEventListener('scroll', updateTheme);
      window.removeEventListener('resize', updateTheme);
    }
  }, []);

  const percentFire = ratio * 100;

  return (
    <div 
      ref={cardRef} 
      onClick={() => navigate(`/${type}/${media.id}`)}
      className="flex-none w-32 sm:w-40 md:w-48 bg-black/40 border border-[color:var(--dynamic-border)] hover:border-[color:var(--dynamic-border-hover)] backdrop-blur-md rounded-xl overflow-hidden transition-all duration-300 group flex flex-col snap-center sm:snap-start cursor-pointer focus:outline-none select-none [-webkit-tap-highlight-color:transparent] [-webkit-touch-callout:none]" 
      tabIndex={0}
      onContextMenu={(e) => e.preventDefault()}
      style={{
        '--dynamic-color': `color-mix(in srgb, #f97316 ${percentFire}%, #22d3ee)`,
        '--dynamic-bg': `color-mix(in srgb, rgba(249,115,22,0.4) ${percentFire}%, rgba(34,211,238,0.4))`,
        '--dynamic-border': `color-mix(in srgb, rgba(249,115,22,0.2) ${percentFire}%, rgba(34,211,238,0.2))`,
        '--dynamic-border-hover': `color-mix(in srgb, rgba(249,115,22,0.6) ${percentFire}%, rgba(34,211,238,0.6))`,
        '--dynamic-overlay': `linear-gradient(to right, rgba(34,211,238,${(1 - ratio) * 0.3}), rgba(249,115,22,${ratio * 0.3}))`
      } as React.CSSProperties}
    >
      <div className="relative aspect-[2/3] overflow-hidden">
        <img src={media.image} alt={media.title} draggable="false" className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110 group-active:scale-105 group-focus:scale-110 pointer-events-none" />
        
        {/* Dynamic Color Sweep Overlay */}
        <div className="absolute inset-0 z-10 pointer-events-none transition-opacity duration-300" style={{ background: 'var(--dynamic-overlay)', mixBlendMode: 'overlay' }} />
        
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 group-focus:bg-black/30 transition-colors duration-300 z-10 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent z-10 opacity-80 group-hover:opacity-90 group-focus:opacity-90 transition-opacity duration-300 pointer-events-none" />
        
        {/* Play Button Overlay */}
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
          <div className="w-14 h-14 rounded-full backdrop-blur-sm border border-[color:var(--dynamic-border-hover)] bg-[color:var(--dynamic-bg)] text-white flex items-center justify-center transform scale-50 opacity-0 group-hover:scale-100 group-hover:opacity-100 group-active:scale-90 group-focus:scale-100 group-focus:opacity-100 transition-all duration-300 ease-out shadow-[0_0_20px_rgba(0,0,0,0.5)]">
            <Play className="w-6 h-6 ml-1 drop-shadow-md fill-current" />
          </div>
        </div>

        <div className="absolute bottom-3 right-3 left-3 z-30 flex flex-col items-start text-right pointer-events-none">
          <h3 className="text-sm md:text-base font-bold text-white mb-1.5 drop-shadow-md line-clamp-1">{media.title}</h3>
          <div className="flex items-center justify-between w-full text-xs font-medium">
            <span className="text-gray-300">{media.year}</span>
            <span className="flex items-center gap-0.5 text-[color:var(--dynamic-color)] transition-colors duration-200">
              <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              {media.rating}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <BackgroundTheme>
      {/* Movies Theme Navigation Header */}
      <nav className="w-full bg-black/30 backdrop-blur-lg border-b border-white/5 relative z-50">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-transparent to-orange-500/10 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-20 flex items-center justify-between relative z-10">
          <AnimatePresence mode="wait">
            {!isSearchOpen ? (
              <motion.div 
                key="nav-content"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="w-full flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl md:text-3xl font-black tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white to-orange-400">
                    Alpha
                  </span>
                </div>
                <div className="hidden lg:flex flex-1 justify-center items-center gap-8 text-base font-semibold text-gray-400">
                  <a href="#" className="text-white hover:text-cyan-400 transition-colors drop-shadow-sm">الرئيسية</a>
                  <a href="#" className="hover:text-orange-400 transition-colors">الأفلام</a>
                  <a href="#" className="hover:text-cyan-400 transition-colors">المسلسلات</a>
                  <a href="#" className="hover:text-white transition-colors">أحدث الإضافات</a>
                </div>
                <div className="flex items-center gap-2 sm:gap-4">
                  <button 
                    onClick={() => setIsSearchOpen(true)}
                    className="p-2 text-gray-300 hover:text-white transition-colors rounded-full hover:bg-white/5"
                  >
                    <Search className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                  {currentUser ? (
                      <div className="relative" ref={profileMenuRef}>
                        <div 
                          title={currentUser.displayName || "مستخدم"} 
                          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-white/20 overflow-hidden hover:border-cyan-400 transition-all cursor-pointer shadow-md" 
                          onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                        >
                          <img 
                            src={userProfile?.photoUrl || currentUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.displayName || 'User')}&background=0ea5e9&color=fff&bold=true`} 
                            alt="Profile Icon" 
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <AnimatePresence>
                          {isProfileMenuOpen && (
                            <motion.div
                              initial={{ opacity: 0, y: 10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 10, scale: 0.95 }}
                              transition={{ duration: 0.2 }}
                              className="absolute top-full mt-3 left-0 w-48 sm:w-56 bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden py-2 z-50 origin-top-left flex flex-col"
                              dir="rtl"
                            >
                              <div className="px-4 py-3 border-b border-white/5 mb-2">
                                <p className="text-white font-bold text-sm truncate">{currentUser.displayName || "مستخدم"}</p>
                                <p className="text-gray-400 text-xs truncate">{currentUser.email}</p>
                              </div>
                              
                              <button 
                                onClick={() => {
                                  setIsProfileMenuOpen(false);
                                  navigate('/profile');
                                }}
                                className="flex items-center gap-3 px-4 py-2.5 text-gray-300 hover:text-white hover:bg-white/5 transition-colors w-full text-right text-sm sm:text-base"
                              >
                                <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                                <span>الإعدادات</span>
                              </button>
                              <button className="flex items-center gap-3 px-4 py-2.5 text-gray-300 hover:text-white hover:bg-white/5 transition-colors w-full text-right text-sm sm:text-base">
                                <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
                                <span>المفضلة</span>
                              </button>
                              <button className="flex items-center gap-3 px-4 py-2.5 text-gray-300 hover:text-white hover:bg-white/5 transition-colors w-full text-right text-sm sm:text-base mb-2">
                                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-500" />
                                <span>السجل</span>
                              </button>
                              
                              <div className="border-t border-white/5 pt-2">
                                <button 
                                  onClick={() => {
                                    setIsProfileMenuOpen(false);
                                    auth.signOut();
                                  }}
                                  className="flex items-center gap-3 px-4 py-2.5 text-red-500 hover:bg-red-500/10 transition-colors w-full text-right text-sm sm:text-base font-bold"
                                >
                                  <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                                  <span>تسجيل الخروج</span>
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                  ) : (
                    <Link to="/login" className="text-xs sm:text-sm font-bold text-white px-4 py-2 sm:px-6 sm:py-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all drop-shadow-md">
                      اشتراك
                    </Link>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="search-content"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="w-full flex justify-center items-center h-full"
              >
                <div className="relative w-full max-w-3xl flex items-center">
                  <Search className="w-5 h-5 absolute right-4 text-cyan-400/80" />
                  <input 
                    type="text" 
                    placeholder="ابحث عن الأفلام، المسلسلات..." 
                    className="w-full bg-black/60 border border-white/20 text-white placeholder-gray-400 rounded-full py-3 pr-12 pl-12 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all shadow-[0_0_20px_rgba(34,211,238,0.1)]"
                    autoFocus
                  />
                  <button 
                    onClick={() => setIsSearchOpen(false)}
                    className="absolute left-2 p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/10"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>

      <header className="pt-8 pb-24 sm:pt-12 sm:pb-32 relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
          >
            <div className="flex items-center justify-center gap-2 sm:gap-6 md:gap-14 mb-8 w-full max-w-4xl mx-auto" dir="ltr">
              <div>
                <WolfEye theme="ice" position="left" />
              </div>
              
              {/* Spacer to keep exact same distance as the previous circle shield */}
              <div aria-hidden="true" className="w-28 sm:w-36 md:w-44 mx-2 sm:mx-6" />

              <div>
                <WolfEye theme="fire" position="right" />
              </div>
            </div>
            
            <div className="flex flex-col items-center justify-center mb-8 relative">
              <div className="relative inline-block" dir="ltr">
                {/* Halo/Glow Effect */}
                <div 
                  className="absolute inset-0 text-7xl sm:text-8xl md:text-[10rem] font-black tracking-wider select-none text-transparent bg-clip-text blur-2xl opacity-70"
                  style={{ backgroundImage: 'linear-gradient(to right, #22d3ee, #ffffff, #f97316)' }}
                  aria-hidden="true"
                >
                  Alpha
                </div>
                {/* Main Title */}
                <h1 
                  className="relative text-7xl sm:text-8xl md:text-[10rem] font-black tracking-wider drop-shadow-md select-none text-transparent bg-clip-text"
                  style={{ backgroundImage: 'linear-gradient(to right, #22d3ee, #ffffff, #f97316)' }}
                >
                  Alpha
                </h1>
              </div>
              
              <div className="text-xl sm:text-3xl md:text-4xl font-bold uppercase tracking-[0.6em] sm:tracking-[0.8em] mt-6 text-white/90 drop-shadow-md">
                movies
              </div>
            </div>
          </motion.div>
        </div>

        <div className="w-full z-10 relative mt-4 md:mt-8">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="w-full relative aspect-[16/9] sm:aspect-[21/9] flex flex-col justify-end group text-right overflow-hidden shadow-2xl" 
            dir="rtl"
          >
            <div 
              className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-105" 
              style={{ 
                backgroundImage: 'url(https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=2000&auto=format&fit=crop)'
              }} 
            />
            {/* Overlays for smooth integration and readability */}
            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#050510] to-transparent z-0" />
            <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#050510] via-[#050510]/80 to-transparent z-0" />
            <div className="absolute inset-y-0 right-0 w-1/3 sm:w-1/2 bg-gradient-to-l from-[#050510] via-[#050510]/50 to-transparent z-0" />
            <div className="absolute inset-y-0 left-0 w-1/3 sm:w-1/2 bg-gradient-to-r from-[#050510] via-[#050510]/10 to-transparent z-0 hidden sm:block" />
            
            <div className="relative z-10 p-4 sm:absolute sm:inset-0 sm:p-10 md:p-12 flex flex-col items-start w-full sm:w-2/3 mt-auto justify-end max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-wrap gap-2 mb-2 md:mb-4">
                <span className="px-2 py-0.5 sm:px-3 sm:py-1 text-[8px] sm:text-xs font-black tracking-wider bg-cyan-500/20 text-cyan-400 rounded-full backdrop-blur-md border border-cyan-500/30 uppercase">حصري</span>
                <span className="px-2 py-0.5 sm:px-3 sm:py-1 text-[8px] sm:text-xs font-black tracking-wider bg-orange-500/20 text-orange-400 rounded-full backdrop-blur-md border border-orange-500/30 uppercase">خيال علمي</span>
                <span className="px-2 py-0.5 sm:px-3 sm:py-1 text-[8px] sm:text-xs font-bold bg-white/10 text-white/80 rounded-full backdrop-blur-md border border-white/10 uppercase drop-shadow-sm">+18</span>
              </div>
              
              <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-2 md:mb-4 drop-shadow-lg leading-tight uppercase font-sans">
                زاوية <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-white">التشويق</span>
              </h2>
              
              <p className="text-xs sm:text-sm md:text-base text-gray-300 mb-3 sm:mb-6 line-clamp-2 md:line-clamp-none max-w-xl font-medium leading-relaxed drop-shadow-sm">
                عالم لا حدود له من المتعة والإثارة. وجهتك الأولى لأحدث الأفلام والمسلسلات، حيث تلتقي الجودة العالية مع المحتوى المتجدد لتجربة مشاهدة لا تُنسى. اكتشف أبعاداً أعمق خلف الكواليس.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto mt-auto sm:mt-0">
                <button className="w-full sm:w-auto flex items-center justify-center gap-1.5 sm:gap-2 px-6 sm:px-8 py-2.5 sm:py-3 bg-white text-black font-black rounded-full hover:bg-gray-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.2)] text-xs sm:text-base">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                  شاهد الآن
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="w-full text-center pt-2 md:pt-4 max-w-[100vw] overflow-hidden">

          {/* Movies Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-4 md:mt-6 w-full"
          >
            <div 
              className="flex justify-start mb-4 text-right relative w-full" 
              dir="rtl"
              style={{
                paddingRight: 'var(--edge-padding, max(1.5rem, calc((100vw - 80rem) / 2 + 1.5rem)))',
                paddingLeft: 'var(--edge-padding, max(1.5rem, calc((100vw - 80rem) / 2 + 1.5rem)))',
              }}
            >
              <div className="relative inline-block">
                <h3 className="text-xl sm:text-2xl font-black text-white pb-2 px-3">أكشن</h3>
                <div className="absolute bottom-0 right-0 left-0 h-[2px] rounded-full bg-gradient-to-r from-transparent via-white/50 to-transparent shadow-[0_0_8px_rgba(255,255,255,0.3)]"></div>
              </div>
            </div>
            
            <div 
              className="flex gap-4 overflow-x-auto pb-4 pt-2 snap-x snap-mandatory scrollbar-hide max-w-[100vw]"
              dir="rtl"
              style={{
                '--edge-padding': 'max(1.5rem, calc((100vw - 80rem) / 2 + 1.5rem))',
                paddingRight: 'var(--edge-padding)',
                paddingLeft: 'var(--edge-padding)',
                scrollPaddingRight: 'var(--edge-padding)',
                scrollPaddingLeft: 'var(--edge-padding)',
              } as React.CSSProperties}
            >
              {MOVIES_DATA.filter((m) => m.category === 'أكشن').map((movie, idx) => (
                <DynamicMediaCard key={idx} media={movie} type="movie" />
              ))}
              <SeeMoreCard category="أكشن" />
            </div>
          </motion.div>

          {/* Drama Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-4 md:mt-2 w-full"
          >
            <div 
              className="flex justify-start mb-4 text-right relative w-full" 
              dir="rtl"
              style={{
                paddingRight: 'var(--edge-padding, max(1.5rem, calc((100vw - 80rem) / 2 + 1.5rem)))',
                paddingLeft: 'var(--edge-padding, max(1.5rem, calc((100vw - 80rem) / 2 + 1.5rem)))',
              }}
            >
              <div className="relative inline-block">
                <h3 className="text-xl sm:text-2xl font-black text-white pb-2 px-3">دراما</h3>
                <div className="absolute bottom-0 right-0 left-0 h-[2px] rounded-full bg-gradient-to-r from-transparent via-white/50 to-transparent shadow-[0_0_8px_rgba(255,255,255,0.3)]"></div>
              </div>
            </div>
            
            <div 
              className="flex gap-4 overflow-x-auto pb-6 pt-2 snap-x snap-mandatory scrollbar-hide max-w-[100vw]"
              dir="rtl"
              style={{
                '--edge-padding': 'max(1.5rem, calc((100vw - 80rem) / 2 + 1.5rem))',
                paddingRight: 'var(--edge-padding)',
                paddingLeft: 'var(--edge-padding)',
                scrollPaddingRight: 'var(--edge-padding)',
                scrollPaddingLeft: 'var(--edge-padding)',
              } as React.CSSProperties}
            >
              {MOVIES_DATA.filter((m) => m.category === 'دراما').map((movie, idx) => (
                <DynamicMediaCard key={idx} media={movie} type="movie" />
              ))}
              <SeeMoreCard category="دراما" />
            </div>
          </motion.div>

          {/* Horror Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-4 md:mt-2 w-full"
          >
            <div 
              className="flex justify-start mb-4 text-right relative w-full" 
              dir="rtl"
              style={{
                paddingRight: 'var(--edge-padding, max(1.5rem, calc((100vw - 80rem) / 2 + 1.5rem)))',
                paddingLeft: 'var(--edge-padding, max(1.5rem, calc((100vw - 80rem) / 2 + 1.5rem)))',
              }}
            >
              <div className="relative inline-block">
                <h3 className="text-xl sm:text-2xl font-black text-white pb-2 px-3">رعب</h3>
                <div className="absolute bottom-0 right-0 left-0 h-[2px] rounded-full bg-gradient-to-r from-transparent via-white/50 to-transparent shadow-[0_0_8px_rgba(255,255,255,0.3)]"></div>
              </div>
            </div>
            
            <div 
              className="flex gap-4 overflow-x-auto pb-6 pt-2 snap-x snap-mandatory scrollbar-hide max-w-[100vw]"
              dir="rtl"
              style={{
                '--edge-padding': 'max(1.5rem, calc((100vw - 80rem) / 2 + 1.5rem))',
                paddingRight: 'var(--edge-padding)',
                paddingLeft: 'var(--edge-padding)',
                scrollPaddingRight: 'var(--edge-padding)',
                scrollPaddingLeft: 'var(--edge-padding)',
              } as React.CSSProperties}
            >
              {MOVIES_DATA.filter((m) => m.category === 'رعب').map((movie, idx) => (
                <DynamicMediaCard key={idx} media={movie} type="movie" />
              ))}
              <SeeMoreCard category="رعب" />
            </div>
          </motion.div>

          {/* Series Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-4 md:mt-2 w-full"
          >
            <div 
              className="flex justify-start mb-4 text-right relative w-full" 
              dir="rtl"
              style={{
                paddingRight: 'var(--edge-padding, max(1.5rem, calc((100vw - 80rem) / 2 + 1.5rem)))',
                paddingLeft: 'var(--edge-padding, max(1.5rem, calc((100vw - 80rem) / 2 + 1.5rem)))',
              }}
            >
              <div className="relative inline-block">
                <h3 className="text-xl sm:text-2xl font-black text-white pb-2 px-3">المسلسلات</h3>
                <div className="absolute bottom-0 right-0 left-0 h-[2px] rounded-full bg-gradient-to-r from-transparent via-white/50 to-transparent shadow-[0_0_8px_rgba(255,255,255,0.3)]"></div>
              </div>
            </div>
            
            <div 
              className="flex gap-4 overflow-x-auto pb-6 pt-2 snap-x snap-mandatory scrollbar-hide max-w-[100vw]"
              dir="rtl"
              style={{
                '--edge-padding': 'max(1.5rem, calc((100vw - 80rem) / 2 + 1.5rem))',
                paddingRight: 'var(--edge-padding)',
                paddingLeft: 'var(--edge-padding)',
                scrollPaddingRight: 'var(--edge-padding)',
                scrollPaddingLeft: 'var(--edge-padding)',
              } as React.CSSProperties}
            >
              {SERIES_DATA.map((series, idx) => (
                <DynamicMediaCard key={idx} media={series} type="series" />
              ))}
              <SeeMoreCard category="المسلسلات" type="series" />
            </div>
          </motion.div>
        </div>
      </header>
    </BackgroundTheme>
  );
}
