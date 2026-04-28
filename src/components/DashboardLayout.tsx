import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { Home, Upload, FileText, User, LogOut, Wand2, Briefcase, Users } from 'lucide-react';
import { cn } from '../lib/utils';
import { useLocation } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItems = user?.role === 'recruiter'
    ? [
      { name: 'Dashboard', href: '/recruiter-dashboard', icon: Home },
      { name: 'Job Openings', href: '/jobs', icon: Briefcase },
      { name: 'Talent Pool', href: '/talent', icon: Users },
    ]
    : [
      { name: 'Dashboard', href: '/dashboard', icon: Home },
      { name: 'Upload Resume', href: '/upload', icon: Upload },
      { name: 'AI Builder', href: '/builder', icon: Wand2 },
      { name: 'History', href: '/history', icon: FileText },
    ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex font-sans text-slate-900 dark:text-slate-100 transition-colors">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col hidden md:flex p-6 justify-between transition-colors">
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-black tracking-tighter text-indigo-600 dark:text-indigo-400 uppercase">Shortlistify</h1>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-widest uppercase mt-1">ATS Optimization Suite</p>
            </div>
            <ThemeToggle />
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname.startsWith(item.href) || location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all",
                    isActive
                      ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-100 dark:border-indigo-800/30"
                      : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 font-semibold"
                  )}
                >
                  <item.icon className={cn("w-4 h-4", isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500 dark:text-slate-400")} />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="p-4 bg-slate-900 dark:bg-slate-950 border border-transparent dark:border-slate-800 rounded-2xl text-white">
          <p className="text-xs font-medium opacity-60">Logged in as</p>
          <p className="text-lg font-black mt-1 truncate">{user?.name}</p>
          <button
            onClick={logout}
            className="mt-4 flex items-center justify-center w-full px-3 py-2 text-xs font-bold bg-white/10 rounded-lg hover:bg-white/20 transition-colors uppercase tracking-widest"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="md:hidden bg-white dark:bg-slate-900 h-16 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 transition-colors">
          <span className="text-xl font-black tracking-tighter text-indigo-600 dark:text-indigo-400 uppercase">Shortlistify</span>
          <ThemeToggle />
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10 flex flex-col gap-8 transition-colors">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
