import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Truck, ArrowRight, User } from 'lucide-react';

export const LandingNavbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 py-3 shadow-xl'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-emerald-400 p-0.5 shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-all">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Truck className="w-5 h-5 text-blue-400 group-hover:text-emerald-400 transition-colors" />
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-black tracking-tight text-white font-mono">
                Freight<span className="text-blue-500">Flow</span>
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <span className="text-[9px] font-bold text-slate-400 tracking-widest uppercase -mt-1">
              Telematics & TMS Platform
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-300">
          <a href="#telematics" className="hover:text-blue-400 transition-colors">
            Live Telematics
          </a>
          <a href="#features" className="hover:text-blue-400 transition-colors">
            Platform Features
          </a>
          <a href="#matrix" className="hover:text-blue-400 transition-colors">
            Role Ecosystem
          </a>
          <a href="#privacy" className="hover:text-blue-400 transition-colors">
            Privacy Shield
          </a>
        </nav>

        {/* Action CTA Buttons */}
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all flex items-center gap-1.5"
          >
            <User className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </Link>

          <Link
            to="/signup"
            className="relative group px-5 py-2.5 rounded-xl text-xs font-extrabold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 hover:opacity-95 shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2 overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-1.5">
              Launch Portal <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </span>
            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        </div>

      </div>
    </header>
  );
};
