import { useState, useEffect } from 'react';
import './App.css';

interface Movie {
  id: number;
  title: string;
  poster_path: string;
  overview: string;
  release_date: string;
  vote_average?: number;
  backdrop_path?: string;
}

interface MovieDetails extends Movie {
  watch_providers?: {
    flatrate?: { provider_name: string; logo_path: string }[];
    buy?: { provider_name: string; logo_path: string }[];
  };
  genres?: { name: string }[];
  runtime?: number;
}

const SUGGESTED_PROMPTS = [
  "Mind-bending psychological thrillers",
  "What movie would change my perspective for a day?",
  "Cozy rainy day movies with jazz vibes",
  "Tagalog horror na may magandang plot twist",
  "Inspiring movies for programmers",
  "A film that makes me rethink life at 2 a.m.",
  "A hidden gem that feels smarter than it looks.",
];

function App() {
  const [mood, setMood] = useState('');
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  // Roulette States
  const [roulete, setRoulete] = useState<Movie[]>([]);
  const [winner, setWinner] = useState<MovieDetails | null>(null);
  
  // Suspense & UI States
  const [isShuffling, setIsShuffling] = useState(false);
  const [tempWinner, setTempWinner] = useState<Movie | null>(null);
  const [revealStage, setRevealStage] = useState<0 | 1 | 2>(0);
  
  const [visits, setVisits] = useState<number | null>(null);

  const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;

  useEffect(() => {
    const updateCounter = async () => {
      try {
        // Using counterapi.dev - a free public counter
        // 'mnp1-wtw' is your unique namespace, 'visits' is the key
        const res = await fetch('https://api.counterapi.dev/v1/mnp1-wtw/visits/up');
        const data = await res.json();
        setVisits(data.count);
      } catch (error) {
        console.error("Counter API unavailable:", error);
      }
    };
    updateCounter();
  }, []);

  const handleRecommend = async (overrideMood?: string) => {
    const searchMood = overrideMood || mood;
    if (!searchMood.trim()) return;
    if (overrideMood) setMood(overrideMood);

    setHasSearched(true);
    setLoading(true);
    setMovies([]);
    setRoulete([]); 
    setWinner(null);

    try {
      const aiResponse = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mood: searchMood }),
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
      alert("AI service is currently unavailable.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToRoulette = (movie: Movie) => {
    if (!roulete.find(m => m.id === movie.id)) {
      setRoulete([...roulete, movie]);
    } else {
      setRoulete(roulete.filter(m => m.id !== movie.id));
    }
  };

  const handleSpin = async () => {
    if (roulete.length === 0) return;

    setIsShuffling(true);
    
    const shuffleInterval = setInterval(() => {
       const randomIndex = Math.floor(Math.random() * roulete.length);
       setTempWinner(roulete[randomIndex]);
    }, 80);

    const randomIndex = Math.floor(Math.random() * roulete.length);
    const selectedMovie = roulete[randomIndex];

    try {
      const detailsRes = await fetch(
        `https://api.themoviedb.org/3/movie/${selectedMovie.id}?api_key=${TMDB_API_KEY}`
      );
      const detailsData = await detailsRes.json();

      const providerRes = await fetch(
        `https://api.themoviedb.org/3/movie/${selectedMovie.id}/watch/providers?api_key=${TMDB_API_KEY}`
      );
      const providerData = await providerRes.json();
      const providers = providerData.results?.PH || providerData.results?.US; 

      const finalWinnerData: MovieDetails = {
        ...selectedMovie,
        ...detailsData,
        watch_providers: providers
      };

      setTimeout(() => {
        clearInterval(shuffleInterval);
        setIsShuffling(false);
        setWinner(finalWinnerData);
        
        setRevealStage(0);
        setTimeout(() => setRevealStage(1), 100);
        setTimeout(() => setRevealStage(2), 2500);
      }, 3000); 

    } catch (error) {
      console.error("Error fetching details", error);
      clearInterval(shuffleInterval);
      setIsShuffling(false);
      setWinner(selectedMovie);
      setRevealStage(1);
      setTimeout(() => setRevealStage(2), 2000);
    }
  };

  const handleReset = () => {
    setWinner(null);
    setRevealStage(0);
    setRoulete([]);
    setIsShuffling(false);
    setTempWinner(null);
  };

  return (
  <>
    {/* SHUFFLING SCREEN */}
    {isShuffling && tempWinner && (
      <div className="fixed inset-0 z-[60] bg-[#0a0118] flex flex-col items-center justify-center">
         <div className="text-purple-400 font-bold text-2xl mb-8 animate-pulse tracking-widest">
            SHUFFLING PICKS...
         </div>
         <div className="w-64 md:w-80 rounded-xl overflow-hidden shadow-[0_0_50px_rgba(168,85,247,0.6)] border-4 border-purple-500 transform scale-105 transition-all duration-75">
            <img
              src={tempWinner.poster_path 
                ? `https://image.tmdb.org/t/p/w500${tempWinner.poster_path}` 
                : 'https://placehold.co/500x750/1a0b2e/8b5cf6?text=No+Image'}
              alt="Shuffling..."
              className="w-full h-full object-cover filter brightness-110"
            />
         </div>
      </div>
    )}

    {/* WINNER SCREEN VIEW */}
    {winner && !isShuffling ? (
       <div className="fixed inset-0 z-50 bg-[#0a0118] flex items-start md:items-center justify-center overflow-y-auto custom-scrollbar">
         <div 
            className="fixed inset-0 opacity-20 bg-cover bg-center transition-opacity duration-1000 pointer-events-none"
            style={{ backgroundImage: `url(https://image.tmdb.org/t/p/original${winner.backdrop_path})` }}
         ></div>

         <div className="relative z-10 w-full max-w-6xl px-4 py-10 md:py-0 flex flex-col md:flex-row items-center md:items-start justify-center gap-6 md:gap-12 transition-all duration-1000 min-h-min">
            
            <div className={`
                flex-shrink-0 transition-all duration-1000 ease-in-out shadow-2xl rounded-xl overflow-hidden border border-purple-500/30
                ${revealStage >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}
                ${revealStage === 2 ? 'w-48 md:w-80 lg:w-96' : 'w-64 md:w-[400px]'} 
            `}>
              <img
                src={winner.poster_path 
                  ? `https://image.tmdb.org/t/p/w500${winner.poster_path}` 
                  : 'https://placehold.co/500x750/1a0b2e/8b5cf6?text=No+Image'}
                alt={winner.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className={`
                flex-1 text-white transition-all duration-1000 delay-300 flex flex-col items-center md:items-start text-center md:text-left
                ${revealStage === 2 ? 'opacity-100 translate-x-0' : 'opacity-0 translate-y-20 md:translate-y-0 md:translate-x-20 absolute right-0 pointer-events-none'}
            `}>
                <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent mb-3 md:mb-4 leading-tight">
                  {winner.title}
                </h1>
                
                <div className="flex flex-wrap justify-center md:justify-start items-center gap-3 md:gap-4 mb-5 md:mb-6 text-xs md:text-base text-gray-300">
                   {winner.release_date && <span className="bg-purple-900/50 px-3 py-1 rounded-full border border-purple-500/20">{winner.release_date.split('-')[0]}</span>}
                   {winner.runtime && <span className="bg-purple-900/50 px-3 py-1 rounded-full border border-purple-500/20">{winner.runtime} min</span>}
                   <span className="flex items-center gap-1 text-yellow-400 font-bold">
                     ⭐ {winner.vote_average?.toFixed(1)}
                   </span>
                </div>

                <p className="text-gray-300 text-sm md:text-lg leading-relaxed mb-6 md:mb-8 max-w-2xl">
                  {winner.overview}
                </p>

                {winner.watch_providers && (winner.watch_providers.flatrate || winner.watch_providers.buy) && (
                  <div className="mb-8 w-full">
                    <h3 className="text-purple-300 font-semibold mb-3 uppercase tracking-wider text-xs md:text-sm">Where to Watch</h3>
                    <div className="flex flex-wrap justify-center md:justify-start gap-3 md:gap-4">
                      {winner.watch_providers.flatrate?.map((provider, i) => (
                        <img 
                          key={i} 
                          src={`https://image.tmdb.org/t/p/original${provider.logo_path}`} 
                          alt={provider.provider_name}
                          className="w-10 h-10 md:w-12 md:h-12 rounded-lg shadow-lg hover:scale-110 transition-transform cursor-help"
                          title={provider.provider_name}
                        />
                      ))}
                      {(!winner.watch_providers.flatrate && winner.watch_providers.buy) && winner.watch_providers.buy.slice(0,3).map((provider, i) => (
                         <img 
                         key={i} 
                         src={`https://image.tmdb.org/t/p/original${provider.logo_path}`} 
                         alt={provider.provider_name}
                         className="w-10 h-10 md:w-12 md:h-12 rounded-lg shadow-lg hover:scale-110 transition-transform cursor-help"
                         title={`Buy/Rent on ${provider.provider_name}`}
                       />
                      ))}
                    </div>
                  </div>
                )}

                <button 
                  onClick={handleReset}
                  className="bg-white text-purple-900 font-bold px-8 py-3 rounded-full hover:bg-purple-100 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.3)] transform hover:scale-105 active:scale-95"
                >
                  Pick Again
                </button>
            </div>
         </div>
       </div>

    ) : (
    
    // MAIN SEARCH VIEW
    <>
      <div className="min-h-screen bg-gradient-to-br from-[#0a0118] via-[#1a0b2e] to-[#0a0118] text-white relative overflow-hidden flex flex-col">
      
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-48 h-48 md:w-72 md:h-72 bg-purple-700 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-48 h-48 md:w-72 md:h-72 bg-violet-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-48 h-48 md:w-72 md:h-72 bg-indigo-700 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* 🧭 NAVBAR WITH VISIT COUNTER */}
      <nav className="absolute top-0 left-0 right-0 z-20 px-4 sm:px-6 py-4 border-b border-purple-800/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
            WTW
          </h2>
          
          <div className="flex items-center gap-3 md:gap-4">
            {/* 👁️ VISIT COUNTER */}
            {visits !== null && (
               <div className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-xs text-purple-300 bg-[#1a0b2e]/50 px-2 py-1 md:px-3 md:py-1.5 rounded-full border border-purple-500/20 shadow-inner">
                  <span>👁️</span>
                  <span className="font-mono">{visits.toLocaleString()}</span>
               </div>
            )}

            {/* ROULETTE COUNTER */}
            {roulete.length > 0 && (
               <span className="text-xs md:text-sm font-medium text-purple-300 flex items-center gap-1">
                 Roulette: <span className="text-white font-bold bg-purple-600 px-2 rounded-full">{roulete.length}</span>
               </span>
            )}
          </div>
        </div>
      </nav>

      {/* Main content */}
      <div className="relative z-10 px-4 sm:px-6 py-6 sm:py-8 flex-1">
        
        {/* Search Section */}
        <div className={`transition-all duration-700 ease-out ${
          hasSearched ? 'mb-8 sm:mb-12 mt-23' : ' flex items-start mt-32 md:mt-49 justify-center'
        }`}>
          <div className="max-w-2xl mx-auto text-center w-full">
            <div className={`transition-all duration-500 ${hasSearched ? 'mb-6 sm:mb-8' : 'mb-6 md:mb-12'}`}>
              <h1 className={`font-bold bg-gradient-to-r from-purple-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent transition-all duration-500 px-4 ${
                hasSearched ? 'text-3xl sm:text-4xl' : 'text-4xl sm:text-5xl md:text-6xl mb-3 sm:mb-4'
              }`}>
                What To Watch
              </h1>
              {!hasSearched && (
                <p className="text-gray-400 text-sm sm:text-lg animate-fade-in px-4">
                  AI-powered recommendations for your exact mood
                </p>
              )}
            </div>
            
            <div className="relative px-4 mb-6 md:mb-8">
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
                    onClick={() => handleRecommend()}
                    disabled={loading || !mood.trim()}
                    className="w-full sm:w-auto bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 disabled:from-gray-700 disabled:to-gray-800 text-white font-semibold px-6 sm:px-8 py-3 sm:py-4 rounded-2xl sm:rounded-full transition-all duration-300 hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed shadow-lg whitespace-nowrap"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        RECO...
                      </span>
                    ) : 'RECO'}
                  </button>
                </div>
              </div>
            </div>

            {/* SUGGESTED PROMPTS */}
            {!hasSearched && (
               <div className="px-2 md:px-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                  <p className="text-gray-500 text-xs md:text-sm mb-3 md:mb-4">Or try these:</p>
                  <div className="flex flex-wrap justify-center gap-2 md:gap-3">
                     {SUGGESTED_PROMPTS.map((prompt, idx) => (
                        <button
                           key={idx}
                           onClick={() => handleRecommend(prompt)}
                           className="bg-purple-900/30 hover:bg-purple-600/50 border border-purple-500/20 hover:border-purple-400 text-gray-300 hover:text-white px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm transition-all duration-300 backdrop-blur-sm cursor-pointer active:scale-95"
                        >
                           {prompt}
                        </button>
                     ))}
                  </div>
               </div>
            )}
          </div>
        </div>

        {/* Results Section */}
        {hasSearched && (
          <div className={`max-w-7xl mx-auto transition-all duration-700 ${
            loading || movies.length > 0 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
            
            {/* Loading */}
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
                    <p className="text-xl font-bold text-gray-200">Selecting movies for you...</p>
                    <p className="text-md font-normal text-gray-300">We pick movies using scores and reviews from Rotten Tomatoes, IMDb, and more</p>
                  </div>
                </div>
              </div>
            )}

            {!loading && (<h1 className='font-bold text-lg my-6 text-center text-gray-300'>Click movies to add to your Roulette!</h1>)}
            
            {/* Movie Grid */}
            {!loading && movies.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-6 pb-24">
                {movies.map((movie, index) => {
                  const isSelected = roulete.some(m => m.id === movie.id);
                  return (
                  <div
                    key={movie.id}
                    className={`group relative bg-[#1a0b2e]/60 backdrop-blur-sm rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105 border 
                    ${isSelected ? 'border-green-500 ring-2 ring-green-500/50 scale-95 opacity-80' : 'border-purple-800/30 hover:shadow-2xl hover:shadow-purple-700/30'}
                    animate-fade-in-up`}
                    style={{ animationDelay: `${index * 50}ms` }}
                    onClick={() => handleAddToRoulette(movie)}
                  >
                    {/* Selected Indicator */}
                    {isSelected && (
                      <div className="absolute z-20 inset-0 bg-green-900/40 flex items-center justify-center">
                         <div className="bg-green-500 text-white p-2 rounded-full shadow-lg">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                           </svg>
                         </div>
                      </div>
                    )}

                    {/* Movie Poster */}
                    <div className="relative aspect-[2/3] overflow-hidden movie-card">
                      <img
                        src={movie.poster_path 
                          ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` 
                          : 'https://placehold.co/500x750/1a0b2e/8b5cf6?text=No+Image'}
                        alt={movie.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0118] via-[#0a0118]/40 to-transparent opacity-30 group-hover:opacity-60 transition-opacity duration-300"></div>
                      
                      {movie.vote_average && (
                        <div className="absolute z-10 top-2 right-2 bg-yellow-500/90 backdrop-blur-sm text-slate-900 font-bold px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm flex items-center gap-1">
                          <span>⭐</span>
                          <span>{movie.vote_average.toFixed(1)}</span>
                        </div>
                      )}
                    </div>

                    <div className="p-3 sm:p-4">
                      <h3 className="font-bold text-sm sm:text-base md:text-lg mb-1 line-clamp-2 group-hover:text-purple-400 transition-colors duration-300">
                        {movie.title}
                      </h3>
                      <p className="text-gray-400 text-xs sm:text-sm">
                        {movie.release_date?.split('-')[0]}
                      </p>
                    </div>
                  </div>
                )})}
              </div>
            )}
          </div>
        )}
      </div>

        {/* ROULETE START BUTTON */}
        {roulete.length > 0 && !loading && !isShuffling && (
          <div className="fixed bottom-10 right-6 z-40 animate-fade-in-up">
            <button 
              onClick={handleSpin}
              className="group relative bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold px-8 py-4 rounded-full shadow-[0_0_30px_rgba(124,58,237,0.5)] transition-all duration-300 hover:scale-110 active:scale-95 flex items-center gap-3 overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              
              <span className="relative">PICK FOR ME</span>
              
              <div className="relative flex items-center justify-center w-8 h-8 bg-white/20 rounded-full">
                 <span className="text-sm">{roulete.length}</span>
              </div>
            </button>
          </div>
        )}

      <footer className="absolute bottom-0 left-0 right-0 z-20 px-4 sm:px-6 py-4 border-t border-purple-800/30 backdrop-blur-sm text-center text-gray-500 text-sm">
        <p>
          &copy; Built with 💜 using Vite, React, Tailwind CSS, Google Generative AI, and TMDB API. (MNP1) - KIT 🎥
        </p>
      </footer>
    </div>
    
    </>
    )}
  </>
  );
}

export default App;