/**
 * Layout Component
 * Wraps all pages with Navbar and Footer.
 */

import Navbar from './Navbar';
import Footer from './Footer';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-cinema-black flex flex-col">
      <Navbar />
      {/* pt-16 ensures content is never hidden under the fixed navbar */}
      <main className="flex-1 pt-16">{children}</main>
      <Footer />
    </div>
  );
}
