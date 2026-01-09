import { useState } from 'react';
import './App.css';
interface Movie {
  id: number;
  title: string;
  poster_path: string;
  overview: string;
  release_date: string;
  vote_average?: number;
}

function App() {
  const [mood, setMood] = useState('');
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;

  const handleRecommend = async () => {
    if (!mood.trim()) return;
    
    setHasSearched(true);
    setLoading(true);
    setMovies([]);

    try {
      const aiResponse = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mood }),
      });
      
      const { movies: titles } = await aiResponse.json();

      const movieDataPromises = titles.map(async (title: string) => {
        const tmdbRes = await fetch(
          `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}`
        );
        const data = await tmdbRes.json();
        return data.results[0]; 
      });

      const fullMovies = await Promise.all(movieDataPromises);
      setMovies(fullMovies.filter(m => m !== undefined));

    } catch (error) {
      console.error(error);
      alert("AI is sleepy... try again!");
    } finally {
      setLoading(false);
    }
  };

  const handleMovieClick = (movie: Movie) => {
    const url = `https://www.google.com/search?q=${encodeURIComponent(movie.title + " movie")}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0118] via-[#1a0b2e] to-[#0a0118] text-white relative overflow-hidden flex flex-col">
      
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-48 h-48 md:w-72 md:h-72 bg-purple-700 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-48 h-48 md:w-72 md:h-72 bg-violet-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-48 h-48 md:w-72 md:h-72 bg-indigo-700 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Navbar */}
      <nav className="absolute top-0 left-0 right-0 z-20 px-4 sm:px-6 py-4 border-b border-purple-800/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
            WTW
          </h2>
        </div>
      </nav>

      {/* Main content */}
      <div className="relative z-10 px-4 sm:px-6 py-6 sm:py-8 flex-1">
        
        {/* Search Section */}
        <div className={`transition-all duration-700 ease-out ${
          hasSearched ? 'mb-8 sm:mb-12 mt-15' : 'min-h-screen flex items-center justify-center'
        }`}>
          <div className="max-w-2xl mx-auto text-center w-full">
            <div className={`transition-all duration-500 ${hasSearched ? 'mb-6 sm:mb-8' : 'mb-8 sm:mb-12'}`}>
              <h1 className={`font-bold bg-gradient-to-r from-purple-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent transition-all duration-500 px-4 ${
                hasSearched ? 'text-3xl sm:text-4xl' : 'text-4xl sm:text-5xl md:text-6xl mb-3 sm:mb-4'
              }`}>
                What To Watch
              </h1>
              {!hasSearched && (
                <p className="text-gray-400 text-base sm:text-lg animate-fade-in px-4">
                  What's your mood today?, I'll find your perfect movie! 
                </p>
              )}
            </div>
            
            <div className="relative px-4">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-700 to-indigo-700 rounded-3xl blur opacity-30"></div>
              <div className="relative bg-[#1a0b2e]/90 backdrop-blur-xl rounded-3xl p-4 sm:p-2 shadow-2xl border border-purple-700/30">
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-2">
                  <input
                    type="text"
                    placeholder="(e.g., adventurous, romantic, thrilling...)"
                    value={mood}
                    onChange={(e) => setMood(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleRecommend()}
                    className="flex-1 bg-transparent border-none text-white px-4 sm:px-6 py-3 sm:py-4 text-base sm:text-lg outline-none placeholder-gray-500 rounded-2xl sm:rounded-full"
                  />
                  <button
                    onClick={handleRecommend}
                    disabled={loading || !mood.trim()}
                    className="w-full sm:w-auto bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 disabled:from-gray-700 disabled:to-gray-800 text-white font-semibold px-6 sm:px-8 py-3 sm:py-4 rounded-2xl sm:rounded-full transition-all duration-300 hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed shadow-lg whitespace-nowrap"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Thinking...
                      </span>
                    ) : 'Recommend'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Results Section */}
        {hasSearched && (
          <div className={`max-w-7xl mx-auto transition-all duration-700 ${
            loading || movies.length > 0 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
            
            {/* Loading Animation */}
            {loading && (
              <div className="text-center py-20">
                <div className="inline-flex flex-col items-center gap-6">
                  <div className="relative w-24 h-24">
                    <div className="absolute inset-0 rounded-full border-4 border-purple-500/30"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-500 animate-spin"></div>
                    <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-blue-500 animate-spin-slow"></div>
                    <div className="absolute inset-4 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 animate-pulse"></div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xl font-medium text-gray-200">consulting the engkantadia sangres...</p>
                    <div className="flex gap-2 justify-center">
                      <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></span>
                      <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce animation-delay-200"></span>
                      <span className="w-2 h-2 bg-pink-500 rounded-full animate-bounce animation-delay-400"></span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Movie Grid */}
            {!loading && movies.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-6 pb-12">
                {movies.map((movie, index) => (
                  <div
                    key={movie.id}
                    className="group relative bg-[#1a0b2e]/60 backdrop-blur-sm rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-700/30 border border-purple-800/30 animate-fade-in-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                    onClick={() => handleMovieClick(movie)}
                  >
                    {/* Movie Poster */}
                    <div className="relative aspect-[2/3] overflow-hidden">
                      <img
                        src={movie.poster_path 
                          ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` 
                          : 'https://placehold.co/500x750/1a0b2e/8b5cf6?text=No+Image'}
                        alt={movie.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      
                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0118] via-[#0a0118]/40 to-transparent opacity-30 group-hover:opacity-60 transition-opacity duration-300"></div>
                      
                      {/* Rating badge */}
                      {movie.vote_average && (
                        <div className="absolute top-2 right-2 bg-yellow-500/90 backdrop-blur-sm text-slate-900 font-bold px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm flex items-center gap-1">
                          <span>⭐</span>
                          <span>{movie.vote_average.toFixed(1)}</span>
                        </div>
                      )}
                    </div>

                    {/* Movie Info */}
                    <div className="p-3 sm:p-4">
                      <h3 className="font-bold text-sm sm:text-base md:text-lg mb-1 line-clamp-2 group-hover:text-purple-400 transition-colors duration-300">
                        {movie.title}
                      </h3>
                      <p className="text-gray-400 text-xs sm:text-sm">
                        {movie.release_date?.split('-')[0]}
                      </p>
                    </div>

                    {/* Hover overlay with description - Hidden on mobile, visible on hover for desktop */}
                    <div className="hidden sm:flex absolute inset-0 bg-gradient-to-t from-[#0a0118] via-[#0a0118]/95 to-[#0a0118]/90 backdrop-blur-sm opacity-0 group-hover:opacity-80 transition-all duration-300 flex-col justify-end p-4 md:p-6">
                      <h3 className="font-bold text-lg md:text-xl mb-2 text-white">
                        {movie.title}
                      </h3>
                      <p className="text-gray-300 text-xs md:text-sm mb-3 line-clamp-4">
                        {movie.overview}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-xs md:text-sm">
                          {movie.release_date?.split('-')[0]}
                        </span>
                        <span className="text-purple-400 text-xs md:text-sm font-medium flex items-center gap-1">
                          Click to search
                          <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -50px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(50px, 50px) scale(1.05); }
        }
        
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes fade-in-up {
          from { 
            opacity: 0; 
            transform: translateY(20px);
          }
          to { 
            opacity: 1; 
            transform: translateY(0);
          }
        }
        
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out backwards;
        }
        
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
        
        .animation-delay-200 {
          animation-delay: 0.2s;
        }
        
        .animation-delay-400 {
          animation-delay: 0.4s;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .line-clamp-4 {
          display: -webkit-box;
          -webkit-line-clamp: 4;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>


      <footer className="absolute bottom-0 left-0 right-0 z-20 px-4 sm:px-6 py-4 border-t border-purple-800/30 backdrop-blur-sm text-center text-gray-500 text-sm">
        <p>
          &copy; Built with 💜 using Vite, React, Tailwind CSS, Google Generative AI, and TMDB API. (MNP1) - kit 🎥
        </p>
      </footer>
    </div>
  );
}

export default App;