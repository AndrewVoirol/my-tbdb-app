// app/page.tsx
export default function Home() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-4">Welcome to Movie App</h1>
      <p className="text-lg mb-8">Discover the latest movies and explore detailed information about each film.</p>
      <a href="/movies" className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
        Browse Movies
      </a>
    </main>
  );
}