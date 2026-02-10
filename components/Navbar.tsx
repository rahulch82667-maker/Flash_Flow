import Image from 'next/image';
import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
      {/* Brand Logo & Name */}
      <Link href="/" className="flex items-center gap-2 group transition-transform duration-300 active:scale-95">
        <div className="bg-black rounded-full p-1 overflow-hidden flex items-center justify-center group-hover:rotate-12 transition-transform duration-500">
          <Image 
            src="/Finance_logo.png" 
            alt="Finance Tracker Logo" 
            width={32} 
            height={32} 
            className="invert object-contain" 
          />
        </div>
        <span className="text-xl font-bold tracking-tight text-gray-900 group-hover:text-blue-600 transition-colors">
          Finance Tracker
        </span>
      </Link>

      <div className="flex items-center gap-6">
        {/* Animated Underline Link */}
        <Link 
          href="/login" 
          className="relative text-sm font-medium text-gray-600 hover:text-black transition-colors group"
        >
          <span>Log in</span>
          <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-black transition-all duration-300 group-hover:w-full"></span>
        </Link>

        {/* Glossy Button Effect */}
        <Link 
          href="/signup" 
          className="relative overflow-hidden bg-black text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-gray-800 hover:shadow-[0_10px_20px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 transition-all duration-300 active:scale-95 group"
        >
          <span className="relative z-10">Get Started</span>
          {/* Subtle Shine Reflection */}
          <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:animate-shine" />
        </Link>
      </div>
    </nav>
  );
}