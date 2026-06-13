"use client";

import Link from 'next/link';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { useSiteSettings } from '../hooks/useSiteSettings';
import {
  GraduationCap,
  BookOpen,
  Building,
  Briefcase,
  Calendar,
  Users,
  MessageSquare,
  ArrowRight,
  CheckCircle,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

export function LandingPage() {
  const { siteName, logoUrl } = useSiteSettings();
  const stats = [
    { number: '1,200+', label: 'Active Students', desc: 'Verified UCC scholars connected' },
    { number: '10+', label: 'Verified Hostels', desc: 'Atlantic, Casford, SRC & more' },
    { number: '500+', label: 'Lecture Notes', desc: 'PDFs, past papers & slides' },
    { number: '98%', label: 'Student Rating', desc: 'Rated highly by UCC campus' },
  ];

  const features = [
    {
      icon: BookOpen,
      title: 'Notes Hub',
      desc: 'Access or upload high-quality lecture slides, handouts, and past exam questions categorized by department and level.',
      color: 'from-blue-500 to-cyan-500',
      tag: 'Academic'
    },
    {
      icon: Building,
      title: 'Hostel Finder',
      desc: 'Browse and review University of Cape Coast (UCC) halls and private hostels with actual prices, real-time map locations, and contact info.',
      color: 'from-emerald-500 to-teal-500',
      tag: 'Housing'
    },
    {
      icon: Briefcase,
      title: 'Jobs & Internships',
      desc: 'Find student-friendly side gigs, part-time jobs, brand ambassador roles, and summer internship opportunities.',
      color: 'from-purple-500 to-indigo-500',
      tag: 'Career'
    },
    {
      icon: Users,
      title: 'Study Groups',
      desc: 'Create or join public and private study circles for specific UCC courses to collaborate, discuss, and share resources.',
      color: 'from-orange-500 to-pink-500',
      tag: 'Social'
    },
    {
      icon: Calendar,
      title: 'Campus Events',
      desc: 'Stay updated on academic workshops, departmental seminars, sports events, and weekend social beach parties.',
      color: 'from-rose-500 to-red-500',
      tag: 'Events'
    },
    {
      icon: MessageSquare,
      title: 'Real-Time Chats',
      desc: 'Coordinate with sellers on the marketplace, message study group members, or DM peers securely with live sockets.',
      color: 'from-violet-500 to-purple-500',
      tag: 'Communication'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors selection:bg-blue-500/30">
      
      {/* Mesh Gradients Background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] overflow-hidden pointer-events-none z-0 opacity-40 dark:opacity-30">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] aspect-square rounded-full bg-gradient-to-br from-blue-400 to-purple-600 blur-[120px]" />
        <div className="absolute top-[-10%] right-[-10%] w-[45%] aspect-square rounded-full bg-gradient-to-br from-pink-500 to-orange-400 blur-[130px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-250/10 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-3 shrink-0">
            {logoUrl ? (
              <img src={logoUrl} alt={siteName} className="w-10 h-10 rounded-2xl object-contain" />
            ) : (
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/30">
                CC
              </div>
            )}
            <span className="font-bold text-lg sm:text-xl tracking-tight bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 bg-clip-text text-transparent hidden sm:block">
              {siteName}
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-gray-600 dark:text-gray-300">
            <a href="#features" className="hover:text-blue-600 dark:hover:text-blue-400 transition">Features</a>
            <a href="#stats" className="hover:text-blue-600 dark:hover:text-blue-400 transition">Statistics</a>
            <a href="#about" className="hover:text-blue-600 dark:hover:text-blue-400 transition">About UCC</a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <ThemeToggle />
            <Link
              href="/admin/login"
              className="text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 px-2 sm:px-3 py-2 transition hidden sm:block"
            >
              Admin
            </Link>
            <Link
              href="/login"
              className="text-sm font-bold text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 px-3 sm:px-4 py-2 transition hidden sm:block"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-sm font-bold px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
            >
              Join Now
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-16 sm:pt-20 pb-12 sm:pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-150/20 dark:border-blue-800/30 text-blue-600 dark:text-blue-400 text-[10px] sm:text-xs font-bold mb-6">
          <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          <span className="truncate">The All-In-One Campus Companion for UCC Students</span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-none text-gray-900 dark:text-white">
          All of Campus Life,{' '}
          <span className="bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 bg-clip-text text-transparent">
            In One Single Hub.
          </span>
        </h1>

        <p className="text-gray-600 dark:text-gray-400 text-lg sm:text-xl max-w-2xl mx-auto mt-6 leading-relaxed">
          Connect with peers, access shared lecture notes, find verified UCC hostels, and discover student-friendly job openings. Built by students, for students.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
          <Link
            href="/signup"
            className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold px-8 py-4 rounded-2xl shadow-xl shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            Get Started for Free
            <ArrowRight className="w-5 h-5" />
          </Link>
          <a
            href="#features"
            className="w-full sm:w-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-850 text-gray-700 dark:text-gray-200 font-bold px-8 py-4 rounded-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
          >
            Explore Features
          </a>
        </div>

        {/* Small trust banner */}
        <div className="flex flex-wrap justify-center items-center gap-6 mt-16 text-gray-400 dark:text-gray-600 text-xs font-semibold uppercase tracking-wider">
          <div className="flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-500" /> Verified Accounts
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-500" /> UCC Halls Integrated
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-500" /> Real-time Sync
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-12 border-t border-b border-gray-200/50 dark:border-gray-850/50">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {stats.map((stat, i) => (
            <div key={i} className="text-center group">
              <p className="text-4xl sm:text-5xl font-black bg-gradient-to-tr from-blue-600 to-purple-600 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">
                {stat.number}
              </p>
              <p className="font-bold text-sm text-gray-900 dark:text-white mt-1.5">{stat.label}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-[180px] mx-auto leading-relaxed">{stat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid Section */}
      <section id="features" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">
            Everything You Need, Built for Student Success
          </h2>
          <p className="text-gray-550 dark:text-gray-400 mt-4 max-w-xl mx-auto">
            Stop switching between dozens of WhatsApp groups and notice boards. We consolidate your campus operations into a single platform.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, i) => (
            <div
              key={i}
              className="bg-white/75 dark:bg-gray-900/75 backdrop-blur-md border border-gray-150/10 dark:border-gray-800/60 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group duration-350"
            >
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${feat.color} flex items-center justify-center text-white mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <feat.icon className="w-6 h-6" />
              </div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-blue-600 dark:text-blue-400">
                {feat.tag}
              </span>
              <h3 className="font-extrabold text-lg text-gray-900 dark:text-white mt-1.5 mb-2">{feat.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Campus Info Callout (UCC specific) */}
      <section id="about" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 md:p-12 text-white relative shadow-2xl overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="max-w-xl md:text-left text-center">
            <span className="text-xs uppercase font-extrabold tracking-wider bg-white/20 text-white px-3 py-1 rounded-full">
              University of Cape Coast
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold mt-4 mb-4">
              Connecting the Southern & Northern Campus
            </h2>
            <p className="text-white/80 leading-relaxed text-sm sm:text-base">
              Whether you are attending lectures at Old Site, studying science labs at New Site, or staying in Kwaprow/Apotokyir, CampusConnect brings all UCC student areas together dynamically.
            </p>
            <div className="flex flex-wrap md:justify-start justify-center gap-4 mt-6 text-xs text-white/90 font-medium">
              <span className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/5 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-green-300" /> Casford Hall Integrated
              </span>
              <span className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/5 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-green-300" /> ATL Mariners Supported
              </span>
              <span className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/5 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-green-300" /> GHS Cedis Formatting
              </span>
            </div>
          </div>

          <div className="shrink-0 flex flex-col items-center gap-4 bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 text-center w-full md:w-auto">
            <GraduationCap className="w-12 h-12 text-yellow-300" />
            <div>
              <p className="font-bold text-lg">Ready to transform your UCC experience?</p>
              <p className="text-xs text-white/70 mt-1">Create an account with your student email</p>
            </div>
            <Link
              href="/signup"
              className="bg-white text-blue-700 font-bold px-6 py-3 rounded-xl shadow hover:bg-gray-100 transition w-full hover:scale-105 active:scale-95"
            >
              Sign Up Free
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-gray-200/50 dark:border-gray-850/50 bg-white dark:bg-gray-950 py-8 sm:py-12 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <img src={logoUrl} alt={siteName} className="w-8 h-8 rounded-xl object-contain" />
            ) : (
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow">
                CC
              </div>
            )}
            <span className="font-bold text-sm text-gray-500">
              © {new Date().getFullYear()} {siteName}. All rights reserved.
            </span>
          </div>

          <div className="flex items-center gap-6 text-sm text-gray-550 dark:text-gray-400 font-medium">
            <Link href="/login" className="hover:text-blue-600 transition">Sign In</Link>
            <Link href="/signup" className="hover:text-blue-600 transition">Register</Link>
            <Link href="/admin/login" className="hover:text-blue-600 transition">Admin</Link>
            <a href="mailto:support@campusconnect.com" className="hover:text-blue-600 transition">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
