import React from 'react';
import { useAuth } from '../lib/AuthContext';
import { Users, Briefcase, Calendar, BarChart2 } from 'lucide-react';

export default function RecruiterDashboard() {
  const { user } = useAuth();

  const stats = [
    { name: 'Total Applicants', value: '128', icon: Users, color: 'bg-indigo-500' },
    { name: 'Active Jobs', value: '12', icon: Briefcase, color: 'bg-emerald-500' },
    { name: 'Interviews', value: '24', icon: Calendar, color: 'bg-amber-500' },
    { name: 'Avg. Match Score', value: '72%', icon: BarChart2, color: 'bg-rose-500' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white uppercase transition-colors">
            Recruiter Dashboard
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium transition-colors">
            Welcome back, {user?.name}. Manage your talent pipeline.
          </p>
        </div>
        <button className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-slate-800 dark:hover:bg-slate-200 transition shadow-lg">
          Post New Job
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-800 p-6 rounded-[32px] shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] dark:shadow-[4px_4px_0px_0px_rgba(15,23,42,0.5)] transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-2xl ${stat.color} text-white`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-black uppercase tracking-widest mb-1">{stat.name}</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white transition-colors">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-800 rounded-[32px] overflow-hidden shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] dark:shadow-[8px_8px_0px_0px_rgba(15,23,42,0.5)] transition-colors">
          <div className="p-8 border-b-2 border-slate-900 dark:border-slate-800 flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Recent Applicants</h2>
            <button className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline uppercase tracking-widest">View All</button>
          </div>
          <div className="p-8">
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-2xl transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
                      JD
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">John Doe</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Applied for Senior Frontend Engineer</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-emerald-500">85%</p>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Match Score</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-800 rounded-[32px] p-8 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] dark:shadow-[8px_8px_0px_0px_rgba(15,23,42,0.5)] transition-colors">
          <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-6">Upcoming Interviews</h2>
          <div className="space-y-6">
            {[1, 2].map((i) => (
              <div key={i} className="border-l-4 border-amber-500 pl-4 py-2">
                <p className="font-bold text-slate-900 dark:text-white">Jane Smith</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-2">Technical Interview • 2:00 PM</p>
                <button className="text-[10px] font-black text-white bg-slate-900 dark:bg-slate-800 px-3 py-1 rounded-lg uppercase tracking-widest">Join Call</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
