'use client';

import { Movie, Genre } from '@/types';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useInView } from 'react-intersection-observer';

// Function to fetch movies from the TMDB API
async function fetchMovies(
  searchTerm: string,
  startYear?: number,
  endYear?: number,
  genres?: number[],
  watchProviders?: string[],
  page: number = 1
): Promise<{ movies: Movie[]; totalResults: number }> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;
    const url = searchTerm
      ? `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(
          searchTerm
        )}&page=${page}`
      : `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}${
          startYear && endYear
            ? `&primary_release_date.gte=${startYear}-01-01&primary_release_date.lte=${endYear}-12-31`
            : ''
        }${genres?.length ? `&with_genres=${genres.join(',')}` : ''}${
          watchProviders?.length ? `&with_watch_providers=${watchProviders.join(',')}` : ''
        }&sort_by=release_date.desc&page=${page}`;

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(`API request failed: ${data.status_message}`);
    }

    const movies = await Promise.all(
      data.results.map(async (movie: Movie) => {
        const detailsResponse = await fetch(
          `https://api.themoviedb.org/3/movie/${movie.id}?api_key=${apiKey}&append_to_response=watch/providers`
        );
        const detailsData = await detailsResponse.json();
        return {
          ...movie,
          runtime: detailsData.runtime,
          watchProviders: detailsData['watch/providers']?.results?.US?.flatrate || [],
        };
      })
    );

    return {
      movies,
      totalResults: data.total_results || 0,
    };
  } catch (error) {
    console.error('Error fetching movies:', error);
    return {
      movies: [],
      totalResults: 0,
    };
  }
}

// Function to fetch movie genres from the TMDB API
async function fetchGenres(): Promise<Genre[]> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;
    const response = await fetch(
      `https://api.themoviedb.org/3/genre/movie/list?api_key=${apiKey}`
    );
    const data = await response.json();
    return data.genres || [];
  } catch (error) {
    console.error('Error fetching genres:', error);
    return [];
  }
}

// Function to fetch movie watch providers from the TMDB API
async function fetchWatchProviders(): Promise<string[]> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;
    const response = await fetch(
      `https://api.themoviedb.org/3/watch/providers/movie?api_key=${apiKey}`
    );
    const data = await response.json();
    return data.results.map((provider: any) => provider.provider_name);
  } catch (error) {
    console.error('Error fetching watch providers:', error);
    return [];
  }
}

export default function MoviesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [startYear, setStartYear] = useState<number | undefined>(undefined);
  const [endYear, setEndYear] = useState<number | undefined>(undefined);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [selectedWatchProviders, setSelectedWatchProviders] = useState<string[]>([]);
  const [allWatchProviders, setAllWatchProviders] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const { ref, inView } = useInView({
    threshold: 0,
  });

  // Function to handle search
  const handleSearch = async () => {
    try {
      const { movies, totalResults } = await fetchMovies(
        searchTerm,
        startYear,
        endYear,
        selectedGenres,
        selectedWatchProviders
      );
      setMovies(movies);
      setTotalResults(totalResults);
      setPage(1);
      setError(null);
    } catch (error) {
      console.error('Error searching movies:', error);
      setError('An error occurred while searching movies. Please try again.');
    }
  };

  // Function to handle year filter
  const handleYearFilter = async () => {
    try {
      setStartYear(2023);
      setEndYear(2024);
      const { movies, totalResults } = await fetchMovies(
        searchTerm,
        2023,
        2024,
        selectedGenres,
        selectedWatchProviders,
        1
      );
      setMovies(movies);
      setTotalResults(totalResults);
      setPage(1);
      setError(null);
    } catch (error) {
      console.error('Error filtering movies by year:', error);
      setError('An error occurred while filtering movies by year. Please try again.');
    }
  };

  // Function to clear year filter
  const clearYearFilter = async () => {
    try {
      setStartYear(undefined);
      setEndYear(undefined);
      const { movies, totalResults } = await fetchMovies(
        searchTerm,
        undefined,
        undefined,
        selectedGenres,
        selectedWatchProviders
      );
      setMovies(movies);
      setTotalResults(totalResults);
      setPage(1);
      setError(null);
    } catch (error) {
      console.error('Error clearing year filter:', error);
      setError('An error occurred while clearing the year filter. Please try again.');
    }
  };

  // Function to toggle genre selection
  const handleGenreToggle = (genreId: number) => {
    if (selectedGenres.includes(genreId)) {
      setSelectedGenres(selectedGenres.filter((id) => id !== genreId));
    } else {
      setSelectedGenres([...selectedGenres, genreId]);
    }
  };

  // Function to toggle watch provider selection
  const handleWatchProviderToggle = (provider: string) => {
    if (selectedWatchProviders.includes(provider)) {
      setSelectedWatchProviders(selectedWatchProviders.filter((p) => p !== provider));
    } else {
      setSelectedWatchProviders([...selectedWatchProviders, provider]);
    }
  };

  // Function to fetch more movies for infinite scrolling
  const fetchMoreMovies = async () => {
    try {
      const { movies: newMovies, totalResults } = await fetchMovies(
        searchTerm,
        startYear,
        endYear,
        selectedGenres,
        selectedWatchProviders,
        page + 1
      );
      setMovies([...movies, ...newMovies]);
      setTotalResults(totalResults);
      setPage(page + 1);
      setError(null);
    } catch (error) {
      console.error('Error fetching more movies:', error);
      setError('An error occurred while fetching more movies. Please try again.');
    }
  };

  // Fetch genres and watch providers on component mount
  useEffect(() => {
    Promise.all([fetchGenres(), fetchWatchProviders()]).then(([genres, watchProviders]) => {
      setGenres(genres);
      setAllWatchProviders(watchProviders);
    });
  }, []);

  // Fetch more movies when scrolled to the bottom
  useEffect(() => {
    if (inView) {
      fetchMoreMovies();
    }
  }, [inView]);

  // Function to get genre names from genre IDs
  const getGenreNames = (genreIds: number[]): string => {
    return genreIds
      .map((id) => genres.find((genre) => genre.id === id)?.name || '')
      .filter(Boolean)
      .join(', ');
  };

  // Function to handle movie click
  const handleMovieClick = (movie: Movie) => {
    setSelectedMovie(movie);
  };

  // Function to close movie details
  const handleCloseMovieDetails = () => {
    setSelectedMovie(null);
  };

  return (
    <div className="container mx-auto px-4 py-8 flex">
      <div className="w-1/4 pr-8">
        {/* Sidebar */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Genres</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {genres.map((genre) => (
              <label key={genre.id} className="inline-flex items-center">
                <input
                  type="checkbox"
                  className="form-checkbox h-5 w-5 text-primary rounded"
                  checked={selectedGenres.includes(genre.id)}
                  onChange={() => handleGenreToggle(genre.id)}
                />
                <span className="ml-2 text-gray-400">{genre.name}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Where to Watch</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {allWatchProviders.map((provider) => (
              <label key={provider} className="inline-flex items-center">
                <input
                  type="checkbox"
                  className="form-checkbox h-5 w-5 text-primary rounded"
                  checked={selectedWatchProviders.includes(provider)}
                  onChange={() => handleWatchProviderToggle(provider)}
                />
                <span className="ml-2 text-gray-400">{provider}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
      <div className="w-3/4">
        {/* Main content */}
        <h1 className="text-4xl font-bold mb-8">Movies</h1>
        <div className="mb-8 flex items-center">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search movies..."
            className="border border-input rounded-l px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            onClick={handleSearch}
            className="bg-primary text-primary-foreground rounded-r px-4 py-2"
          >
            Search
          </button>
        </div>
        <div className="mb-8">
          <button
            onClick={handleYearFilter}
            className={`btn btn-primary mr-2 ${
              startYear === 2023 && endYear === 2024 ? 'active' : ''
            }`}
            disabled={startYear === 2023 && endYear === 2024}
          >
            2023-2024
          </button>
          {startYear === 2023 && endYear === 2024 && (
            <button onClick={clearYearFilter} className="btn btn-destructive">
              Clear Filter
            </button>
          )}
        </div>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {movies.length > 0 ? (
          <>
            <p className="text-muted-foreground mb-4">
              Showing {movies.length} of {totalResults} results
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {movies.map((movie) => (
                <li
                  key={movie.id}
                  className="bg-card text-card-foreground rounded shadow p-4 relative transition duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-lg cursor-pointer"
                  onClick={() => handleMovieClick(movie)}
                >
                  <div className="aspect-w-2 aspect-h-3 mb-4">
                    {movie.poster_path ? (
                      <Image
                        src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                        alt={movie.title}
                        layout="fill"
                        objectFit="cover"
                        className="rounded"
                      />
                    ) : (
                      <div className="bg-gray-200 flex items-center justify-center rounded">
                        <p className="text-gray-500">No poster available</p>
                      </div>
                    )}
                  </div>
                  <div className="mt-4">
                    <h2 className="text-xl font-bold mb-1">{movie.title}</h2>
                    <p className="text-muted-foreground text-sm mb-2">
                      {movie.release_date?.slice(0, 4)}
                    </p>
                    {movie.watchProviders.length > 0 && (
                      <div className="mt-2">
                        <h3 className="text-lg font-bold mb-1">Watch Providers:</h3>
                        <ul>
                          {movie.watchProviders.map((provider) => (
                            <li key={provider.provider_id}>{provider.provider_name}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black bg-opacity-75 opacity-0 transition duration-300 ease-in-out hover:opacity-100">
                      <div className="p-4">
                        <p className="text-white line-clamp-6">{movie.overview}</p>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div ref={ref} className="h-8"></div>
          </>
        ) : (
          <p className="text-muted-foreground">No movies found.</p>
        )}
      </div>
      {selectedMovie && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">{selectedMovie.title}</h2>
            <p className="text-muted-foreground text-sm mb-4">
              {selectedMovie.release_date?.slice(0, 4)}
            </p>
            <div className="aspect-w-16 aspect-h-9 mb-4">
              {selectedMovie.poster_path ? (
                <Image
                  src={`https://image.tmdb.org/t/p/w500${selectedMovie.poster_path}`}
                  alt={selectedMovie.title}
                  layout="fill"
                  objectFit="cover"
                  className="rounded"
                />
              ) : (
                <div className="bg-gray-200 flex items-center justify-center rounded">
                  <p className="text-gray-500">No poster available</p>
                </div>
              )}
            </div>
            <p className="text-muted-foreground mb-4">
              Genre: {getGenreNames(selectedMovie.genre_ids)}
            </p>
            <p className="text-muted-foreground mb-4">
              Runtime: {selectedMovie.runtime} minutes
            </p>
            <p className="mb-4">{selectedMovie.overview}</p>
            {selectedMovie.watchProviders.length > 0 && (
              <div className="mt-4">
                <h3 className="text-lg font-bold mb-2">Watch Providers:</h3>
                <ul>
                  {selectedMovie.watchProviders.map((provider) => (
                    <li key={provider.provider_id}>{provider.provider_name}</li>
                  ))}
                </ul>
              </div>
            )}
            <button
              onClick={handleCloseMovieDetails}
              className="bg-primary text-primary-foreground rounded px-4 py-2 mt-4">
              Close</button>
          </div>
        </div>
      )}
    </div>
  );
}