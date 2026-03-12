import Link from 'next/link';
import { MdLocalMovies } from 'react-icons/md';

export default function Footer() {
  return (
    <footer className="bg-cinema-dark border-t border-cinema-border mt-16 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <MdLocalMovies className="text-cinema-accent text-2xl" />
            <span
              className="text-xl text-white"
              style={{ fontFamily: 'Bebas Neue, serif', letterSpacing: '0.15em' }}
            >
              CINESTREAM
            </span>
          </div>
          <p className="text-cinema-muted text-sm text-center">
            University project — streams public-domain films from Internet Archive.
            No copyrighted content is hosted.
          </p>
          <div className="flex gap-4 text-cinema-muted text-sm">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <Link href="/search" className="hover:text-white transition-colors">Browse</Link>
            <Link href="/admin" className="hover:text-white transition-colors">Admin</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
