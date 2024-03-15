// app/layout.tsx
import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Movie App',
  description: 'A minimalist movie app built with Next.js and TMDB API',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-900 text-white`}>
        <nav className="bg-gray-800 py-4">
          <div className="container mx-auto px-4">
            <a href="/" className="text-xl font-bold">
              Movie App
            </a>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}