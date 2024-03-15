export interface Movie {
  id: number;
  title: string;
  release_date: string;
  poster_path: string;
  genre_ids: number[];
  overview: string;
  runtime: number;
  watchProviders: {
    logo_path: string;
    provider_id: string;
    provider_name: string;
    display_priority: number;
  }[];
}

export interface Genre {
  id: number;
  name: string;
}