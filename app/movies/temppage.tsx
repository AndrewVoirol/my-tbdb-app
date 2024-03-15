temppage.tsx
'use client';

//ADD PAGINATION
//ADD TOTAL MOVIE COUNT FROM QUERY
//ADD GENRE PICKER
//ADD RUNTIME DETAIL ON MOVIE CARD AND FILTER FOR SEARCH
//ADD SERVICE AVAILABLE ON
//ADD AWARDS AND NOMINATIONS LISTING
//ADD THE 2023-2024 BUTTON

import { Movie, Genre } from '../../types';
import { useState } from 'react';
import Image from 'next/image';

async function fetchMovies(searchTerm: string, startYear?: number, endYear?: number): Promise<Movie[]> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;
    const url = searchTerm
      ? `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(
          searchTerm
        )}`
      : `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}${
          startYear && endYear ? `&primary_release_date.gte=${startYear}-01-01&primary_release_date.lte=${endYear}-12-31` : ''
        }`;

    const response = await fetch(url);
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('Error fetching movies:', error);
    return [];
  }
}

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

export default function MoviesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [startYear, setStartYear] = useState<number | undefined>(undefined);
  const [endYear, setEndYear] = useState<number | undefined>(undefined);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);

  const handleSearch = async () => {
    const fetchedMovies = await fetchMovies(searchTerm, startYear, endYear);
    setMovies(fetchedMovies);
  };

  const handleYearFilter = async () => {
    setStartYear(2023);
    setEndYear(2024);
    const fetchedMovies = await fetchMovies(searchTerm, 2023, 2024);
    setMovies(fetchedMovies);
  };

  const clearYearFilter = async () => {
    setStartYear(undefined);
    setEndYear(undefined);
    const fetchedMovies = await fetchMovies(searchTerm);
    setMovies(fetchedMovies);
  };

  // Fetch genres on component mount
  useState(() => {
    fetchGenres().then((fetchedGenres) => setGenres(fetchedGenres));
  }, []);

  const getGenreNames = (genreIds: number[]): string => {
    return genreIds
      .map((id) => genres.find((genre) => genre.id === id)?.name || '')
      .filter(Boolean)
      .join(', ');
  };

  return (
    <div className="container mx-auto px-4 py-8">
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
          className={`bg-secondary text-secondary-foreground rounded px-4 py-2 mr-2 ${
            startYear === 2023 && endYear === 2024 ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          disabled={startYear === 2023 && endYear === 2024}
        >
          2023-2024
        </button>
        {startYear === 2023 && endYear === 2024 && (
          <button
            onClick={clearYearFilter}
            className="bg-destructive text-destructive-foreground rounded px-4 py-2"
          >
            Clear Filter
          </button>
        )}
      </div>
      {movies.length > 0 ? (
        <>
          <p className="text-muted-foreground mb-4">{movies.length} results found</p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {movies.map((movie) => (
              <li key={movie.id} className="bg-card text-card-foreground rounded shadow p-4">
                <h2 className="text-xl font-bold mb-2">{movie.title}</h2>
                <p className="text-muted-foreground mb-2">Released: {movie.release_date}</p>
                <Image
                  src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                  alt={movie.title}
                  width={500}
                  height={750}
                  className="mb-4 rounded"
                />
                <p className="text-muted-foreground mb-2">
                  Genre: {getGenreNames(movie.genre_ids)}
                </p>
                <p>{movie.overview}</p>
              </li>
            ))}
          </ul>

        </>
      ) : (
        <p className="text-muted-foreground">No movies found.</p>
      )}
    </div>
  );
}