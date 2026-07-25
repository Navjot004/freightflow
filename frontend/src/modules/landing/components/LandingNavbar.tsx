import React from 'react';
import { Link } from 'react-router-dom';
import { Sun, Moon, ArrowRight, User } from 'lucide-react';
import { useThemeStore } from '../../../store/themeStore';

export const LandingNavbar: React.FC = () => {
  const { theme, setTheme } = useThemeStore();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-8">
        
        {/* Brand Logo with Official FreightFlow Logo Image */}
        <Link to="/" className="flex items-center gap-2 group">
          <img
            src="/assets/logo-full.png"
            alt="FreightFlow Logo"
            className="h-8 w-auto dark:invert transition-transform group-hover:scale-105"
          />
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition-colors">Features</a>
          <a href="#portals" className="hover:text-foreground transition-colors">Portals</a>
          <a href="#telematics" className="hover:text-foreground transition-colors">Telematics</a>
          <a href="#margins" className="hover:text-foreground transition-colors">Broker Margins</a>
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {/* Light/Dark Mode Toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5 text-slate-600" />}
          </button>

          <Link
            to="/login"
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            <User className="w-4 h-4" />
            <span>Sign In</span>
          </Link>

          <Link
            to="/signup"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-all shadow-sm"
          >
            <span>Get Started</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

      </div>
    </header>
  );
};
