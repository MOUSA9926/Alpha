import { useState, useMemo, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Search, Filter, Play } from "lucide-react";
import { BackgroundTheme } from "../../components/BackgroundTheme";
import { MOVIES_DATA } from "../../data/movies";
import { SERIES_DATA } from "../../data/series";

type SortOption = "default" | "rating-desc" | "rating-asc" | "year-desc" | "year-asc";

export default function CategoryView() {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("default");
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const decodedCategory = decodeURIComponent(categorySlug || "");

  // Combine movies and series
  const ALL_MEDIA = useMemo(() => [
    ...MOVIES_DATA.map(m => ({ ...m, type: "movie" })),
    ...SERIES_DATA.map(s => ({ ...s, type: "series" }))
  ], []);

  // Filter movies for this category
  const categoryMovies = useMemo(() => {
    return ALL_MEDIA.filter((media) => media.category === decodedCategory);
  }, [decodedCategory, ALL_MEDIA]);

  // Apply search and sort
  const filteredAndSortedMovies = useMemo(() => {
    let result = [...categoryMovies];

    if (searchQuery) {
      result = result.filter(
        (movie) => movie.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    switch (sortBy) {
      case "rating-desc":
        result.sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));
        break;
      case "rating-asc":
        result.sort((a, b) => parseFloat(a.rating) - parseFloat(b.rating));
        break;
      case "year-desc":
        result.sort((a, b) => parseInt(b.year) - parseInt(a.year));
        break;
      case "year-asc":
        result.sort((a, b) => parseInt(a.year) - parseInt(b.year));
        break;
      default:
        break;
    }

    return result;
  }, [categoryMovies, searchQuery, sortBy]);

  return (
    <BackgroundTheme>
      <div className="min-h-screen pb-20 max-w-[100vw] overflow-x-hidden" dir="rtl">
        {/* Navigation */}
        <nav className="w-full bg-black/50 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-transparent to-orange-500/10 pointer-events-none" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between relative z-10">
            <div className="flex items-center gap-4">
              <Link 
                to="/" 
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors border border-white/5"
              >
                <ArrowLeft className="w-5 h-5 text-gray-300" />
              </Link>
              <h1 className="text-2xl md:text-3xl font-black text-white drop-shadow-md">
                {decodedCategory}
              </h1>
            </div>

            <div className="hidden sm:flex items-center gap-4">
              <span className="text-xl font-black tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white to-orange-400">
                Alpha
              </span>
            </div>
          </div>
        </nav>

        {/* Filters and Search */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 md:mt-12 mb-8">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black/40 backdrop-blur-md rounded-2xl border border-white/5 p-4 sm:p-6 flex flex-col md:flex-row gap-4 items-center justify-between"
          >
            <div className="relative w-full md:max-w-md">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن فيلم..."
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pr-10 pl-4 text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all font-medium"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <Filter className="w-5 h-5 text-gray-400 shrink-0" />
              <span className="text-sm font-medium text-gray-300 whitespace-nowrap">ترتيب حسب:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:border-orange-500/50 transition-all text-sm font-medium cursor-pointer flex-1 md:flex-none appearance-none"
              >
                <option value="default">الافتراضي</option>
                <option value="rating-desc">الأعلى تقييماً</option>
                <option value="rating-asc">الأقل تقييماً</option>
                <option value="year-desc">الأحدث (السنة)</option>
                <option value="year-asc">الأقدم (السنة)</option>
              </select>
            </div>
          </motion.div>
        </div>

        {/* Movies Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatePresence mode="wait">
            {filteredAndSortedMovies.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-20 text-center text-gray-400 text-lg"
              >
                لم يتم العثور على نتائج.
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6"
              >
                {filteredAndSortedMovies.map((movie: any, idx) => (
                  <motion.div 
                    key={`${movie.title}-${idx}`}
                    onClick={() => navigate(`/${movie.type}/${movie.id}`)}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className="group flex flex-col relative aspect-[2/3] rounded-xl overflow-hidden cursor-pointer"
                  >
                    <img src={movie.image} alt={movie.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent z-10 opacity-80 group-hover:opacity-90 transition-opacity duration-300 pointer-events-none" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 z-10 pointer-events-none" />

                    <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                      <div className="w-12 h-12 rounded-full backdrop-blur-sm border border-cyan-500/50 bg-cyan-500/30 text-white flex items-center justify-center transform scale-50 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300 ease-out shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                        <Play className="w-5 h-5 ml-1 drop-shadow-md fill-current" />
                      </div>
                    </div>

                    <div className="absolute bottom-3 right-3 left-3 z-30 flex flex-col items-start text-right pointer-events-none">
                      <h3 className="text-sm md:text-base font-bold text-white mb-1.5 drop-shadow-md line-clamp-1">{movie.title}</h3>
                      <div className="flex items-center justify-between w-full text-xs font-medium">
                        <span className="text-gray-300">{movie.year}</span>
                        <span className="flex items-center gap-0.5 text-cyan-400">
                          <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                          {movie.rating}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </BackgroundTheme>
  );
}
