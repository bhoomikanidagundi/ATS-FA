import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, FileText, Zap, BarChart3 } from 'lucide-react';
import { ThemeToggle } from '../components/ThemeToggle';
import { useAuth } from '../lib/AuthContext';
import ShaderBackground from '../components/ShaderBackground';

export default function Landing() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen font-sans text-slate-900 dark:text-slate-100 transition-colors relative overflow-hidden">
      <ShaderBackground />
      {/* Navbar */}
      <nav className="container mx-auto px-6 py-6 flex items-center justify-between relative z-10">
        <div className="flex items-center">
          <Link to="/" className="text-xl font-black tracking-tighter text-white uppercase">Shortlistify</Link>
        </div>
        <div className="flex items-center space-x-6">
          <ThemeToggle />
          {user ? (
            <>
              <Link to="/dashboard" className="text-xs font-bold text-slate-300 hover:text-white transition-colors uppercase tracking-widest">Dashboard</Link>
              <button onClick={logout} className="text-xs font-bold bg-white text-slate-900 px-5 py-3 rounded-xl hover:bg-slate-200 transition uppercase tracking-widest">Log Out</button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-xs font-bold text-slate-300 hover:text-white transition-colors uppercase tracking-widest">Log in</Link>
              <Link to="/signup" className="text-xs font-bold bg-white text-slate-900 px-5 py-3 rounded-xl hover:bg-slate-200 transition uppercase tracking-widest">Get Started</Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <main>
        <div className="container mx-auto px-6 py-20 lg:py-32 text-center max-w-5xl">
          <div className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 border-2 border-indigo-100 dark:bg-indigo-950/50 dark:border-indigo-800/50 dark:text-indigo-300 mb-8 uppercase tracking-widest transition-colors">
            <Zap className="h-4 w-4" /> Powered by actual ATS rules
          </div>
          <h1 className="text-6xl lg:text-8xl font-black tracking-tighter text-white mb-8 uppercase leading-[0.9] transition-colors">
            Beat the <br /><span className="text-indigo-400">Filters</span>
          </h1>
          <p className="text-xl text-slate-300 mb-12 max-w-2xl mx-auto font-medium transition-colors">
            Upload your resume and get a ruthless, actionable breakdown of why you are getting rejected and exactly how to fix it.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
            <Link to={user ? "/upload" : "/signup"} className="inline-flex items-center justify-center text-sm font-black px-10 py-5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-800 text-slate-900 dark:text-white hover:bg-slate-900 dark:hover:bg-slate-800 hover:text-white transition-all w-full sm:w-auto shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] dark:shadow-[8px_8px_0px_0px_rgba(15,23,42,0.5)] uppercase tracking-widest">
              Scan My Resume <ArrowRight className="ml-3 w-5 h-5" />
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm py-24 border-t-2 border-slate-900 dark:border-slate-800 transition-colors">
          <div className="container mx-auto px-6 max-w-5xl">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white mb-4 uppercase transition-colors">Everything you need</h2>
              <p className="text-lg font-medium text-slate-500 dark:text-slate-400 transition-colors">Our engine simulates exactly what recruiters see when you apply.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 text-left">
              <div className="bg-slate-50 dark:bg-slate-950 border-2 border-slate-900 dark:border-slate-800 p-8 rounded-[32px] shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] dark:shadow-[4px_4px_0px_0px_rgba(15,23,42,0.5)] transition-colors">
                <div className="w-12 h-12 bg-indigo-600 dark:bg-indigo-500 text-white rounded-xl flex items-center justify-center mb-6">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-3 tracking-tight transition-colors">ATS Scoring</h3>
                <p className="text-slate-500 dark:text-slate-400 font-medium transition-colors">Get a precise 0-100 score based on keyword matches, formatting, and industry standards.</p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 border-2 border-slate-900 dark:border-slate-800 p-8 rounded-[32px] shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] dark:shadow-[4px_4px_0px_0px_rgba(15,23,42,0.5)] transition-colors">
                <div className="w-12 h-12 bg-amber-500 text-white rounded-xl flex items-center justify-center mb-6">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-3 tracking-tight transition-colors">Actionable Tips</h3>
                <p className="text-slate-500 dark:text-slate-400 font-medium transition-colors">Don't just see what's wrong. Get AI-generated suggestions and exact bullet rewrites.</p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 border-2 border-slate-900 dark:border-slate-800 p-8 rounded-[32px] shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] dark:shadow-[4px_4px_0px_0px_rgba(15,23,42,0.5)] transition-colors">
                <div className="w-12 h-12 bg-emerald-500 text-white rounded-xl flex items-center justify-center mb-6">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-3 tracking-tight transition-colors">Job Matching</h3>
                <p className="text-slate-500 dark:text-slate-400 font-medium transition-colors">Paste a job description and instantly see your missing keywords and skill gaps.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
