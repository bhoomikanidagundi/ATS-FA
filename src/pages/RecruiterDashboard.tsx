import React from 'react';
import { useAuth } from '../lib/AuthContext';
import { Users, Briefcase, Calendar, BarChart2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface StatsData {
  totalApplicants: number;
  activeJobs: number;
  totalInterviews: number;
  avgScore: number;
}

interface Application {
  id: string;
  candidateName: string;
  jobTitle: string;
  matchScore: number;
  status: string;
  createdAt: string;
  updatedAt?: string;
}

export default function RecruiterDashboard() {
  const { user, token } = useAuth();
  const [isPosting, setIsPosting] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [statsData, setStatsData] = React.useState<StatsData | null>(null);
  const [recentApps, setRecentApps] = React.useState<Application[]>([]);
  const [jobForm, setJobForm] = React.useState({
    title: '',
    description: '',
    role: '',
    years_of_exp: '',
    location: '',
    work_mode: 'Remote',
    skills: '',
    salary: '',
    notice_period: '',
    candidate_name: ''
  });
  const [suggestions, setSuggestions] = React.useState<any[]>([]);
  const [isSuggesting, setIsSuggesting] = React.useState(false);

  React.useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const apiUrl = import.meta.env.VITE_APP_URL || '';
        const [statsRes, appsRes] = await Promise.all([
          fetch(`${apiUrl}/api/recruiter/stats`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${apiUrl}/api/applications`, { headers: { Authorization: `Bearer ${token}` } })
        ]);

        if (statsRes.ok) setStatsData(await statsRes.json());
        if (appsRes.ok) setRecentApps(await appsRes.json());
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [token]);

  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSuggesting(true);
    try {
      const apiUrl = import.meta.env.VITE_APP_URL || '';
      const skillsArray = jobForm.skills.split(',').map(s => s.trim()).filter(s => s);
      const res = await fetch(`${apiUrl}/api/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...jobForm, skills: skillsArray })
      });

      if (res.ok) {
        const job = await res.json();
        // Fetch suggestions for this new job
        const suggRes = await fetch(`${apiUrl}/api/jobs/${job.id}/suggestions`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (suggRes.ok) {
          setSuggestions(await suggRes.json());
        } else {
          const errData = await suggRes.json();
          alert("Failed to fetch suggestions: " + (errData.error || suggRes.statusText));
        }
        setIsPosting(false);
        setJobForm({
          title: '', description: '', role: '', years_of_exp: '', location: '',
          work_mode: 'Remote', skills: '', salary: '', notice_period: '', candidate_name: ''
        });
      } else {
        const errData = await res.json();
        alert("Failed to create job: " + (errData.error || res.statusText));
      }
    } catch (error: any) {
      console.error("Error posting job:", error);
      alert("Error posting job: " + error.message);
    } finally {
      setIsSuggesting(false);
    }
  };

  const stats = [
    { name: 'Total Applicants', value: statsData?.totalApplicants || '0', icon: Users, color: 'bg-indigo-500' },
    { name: 'Active Jobs', value: statsData?.activeJobs || '0', icon: Briefcase, color: 'bg-emerald-500' },
    { name: 'Interviews', value: statsData?.totalInterviews || '0', icon: Calendar, color: 'bg-amber-500' },
    { name: 'Avg. Match Score', value: `${statsData?.avgScore || 0}%`, icon: BarChart2, color: 'bg-rose-500' },
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-500 font-bold uppercase tracking-widest animate-pulse">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
        <p>Loading Dashboard...</p>
      </div>
    );
  }

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
        <button 
          onClick={() => setIsPosting(!isPosting)}
          className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-slate-800 dark:hover:bg-slate-200 transition shadow-lg"
        >
          {isPosting ? 'Cancel' : 'Post New Job'}
        </button>
      </div>

      {isPosting && (
        <div className="bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-800 p-8 rounded-[32px] shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] dark:shadow-[8px_8px_0px_0px_rgba(15,23,42,0.5)] transition-all">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-6">Create New Job</h2>
          <form onSubmit={handlePostJob} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Job Title</label>
                <input 
                  required
                  value={jobForm.title}
                  onChange={e => setJobForm({...jobForm, title: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 font-medium focus:border-slate-900 dark:focus:border-white outline-none transition-colors"
                  placeholder="e.g. Senior Frontend Engineer"
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Role</label>
                <input 
                  value={jobForm.role}
                  onChange={e => setJobForm({...jobForm, role: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 font-medium focus:border-slate-900 dark:focus:border-white outline-none transition-colors"
                  placeholder="e.g. Developer"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Years of Exp</label>
                  <input 
                    value={jobForm.years_of_exp}
                    onChange={e => setJobForm({...jobForm, years_of_exp: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 font-medium focus:border-slate-900 dark:focus:border-white outline-none transition-colors"
                    placeholder="e.g. 5+"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Work Mode</label>
                  <select 
                    value={jobForm.work_mode}
                    onChange={e => setJobForm({...jobForm, work_mode: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 font-medium focus:border-slate-900 dark:focus:border-white outline-none transition-colors"
                  >
                    <option>Remote</option>
                    <option>Hybrid</option>
                    <option>On-site</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Skills (Comma separated)</label>
                <input 
                  value={jobForm.skills}
                  onChange={e => setJobForm({...jobForm, skills: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 font-medium focus:border-slate-900 dark:focus:border-white outline-none transition-colors"
                  placeholder="React, Node.js, TypeScript"
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Location</label>
                <input 
                  value={jobForm.location}
                  onChange={e => setJobForm({...jobForm, location: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 font-medium focus:border-slate-900 dark:focus:border-white outline-none transition-colors"
                  placeholder="e.g. San Francisco, CA"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Salary</label>
                  <input 
                    value={jobForm.salary}
                    onChange={e => setJobForm({...jobForm, salary: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 font-medium focus:border-slate-900 dark:focus:border-white outline-none transition-colors"
                    placeholder="e.g. $120k - $150k"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Notice Period</label>
                  <input 
                    value={jobForm.notice_period}
                    onChange={e => setJobForm({...jobForm, notice_period: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 font-medium focus:border-slate-900 dark:focus:border-white outline-none transition-colors"
                    placeholder="e.g. 30 days"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Candidate Name (Optional Search)</label>
                <input 
                  value={jobForm.candidate_name}
                  onChange={e => setJobForm({...jobForm, candidate_name: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 font-medium focus:border-slate-900 dark:focus:border-white outline-none transition-colors"
                  placeholder="Search specific candidate..."
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Description</label>
                <textarea 
                  required
                  value={jobForm.description}
                  onChange={e => setJobForm({...jobForm, description: e.target.value})}
                  rows={4}
                  className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 font-medium focus:border-slate-900 dark:focus:border-white outline-none transition-colors resize-none"
                  placeholder="Detailed job description..."
                />
              </div>
            </div>

            <div className="md:col-span-2 mt-4">
              <button 
                type="submit"
                disabled={isSuggesting}
                className="w-full bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 transition shadow-lg disabled:opacity-50"
              >
                {isSuggesting ? 'Creating & Analyzing...' : 'Create Job & Find Matches'}
              </button>
            </div>
          </form>
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="bg-indigo-50 dark:bg-indigo-950/20 border-2 border-indigo-500/50 p-8 rounded-[32px] animate-in zoom-in-95 duration-500">
          <h2 className="text-xl font-black text-indigo-900 dark:text-indigo-300 uppercase tracking-tight mb-6 flex items-center gap-2">
            <Users className="w-6 h-6" />
            Top Matching Candidates
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {suggestions.map((s) => (
              <div key={s.userId} className="bg-white dark:bg-slate-900 border-2 border-indigo-200 dark:border-indigo-900 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
                    {s.name?.split(' ').map((n: string) => n[0]).join('') || '??'}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{s.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{s.email}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{s.score}%</p>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Keyword Match</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {s.matchingSkills?.slice(0, 3).map((skill: string) => (
                    <span key={skill} className="px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold rounded-lg uppercase">
                      {skill}
                    </span>
                  ))}
                  {s.matchingSkills?.length > 3 && (
                    <span className="text-[10px] text-slate-400 font-bold">+{s.matchingSkills.length - 3} more</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
              {recentApps.length > 0 ? (
                recentApps.slice(0, 5).map((app) => (
                  <div key={app.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-2xl transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
                        {app.candidateName?.split(' ').map((n: string) => n[0]).join('') || '??'}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{app.candidateName}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Applied for {app.jobTitle}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn(
                        "text-lg font-black",
                        (app.matchScore || 0) >= 80 ? "text-emerald-500" : (app.matchScore || 0) >= 50 ? "text-amber-500" : "text-rose-500"
                      )}>{app.matchScore || 0}%</p>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Match Score</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-slate-400 font-bold italic">No applications yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-800 rounded-[32px] p-8 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] dark:shadow-[8px_8px_0px_0px_rgba(15,23,42,0.5)] transition-colors">
          <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-6">Upcoming Interviews</h2>
          <div className="space-y-6">
            {recentApps.filter(a => a.status === 'interview').length > 0 ? (
              recentApps.filter(a => a.status === 'interview').map((app) => (
                <div key={app.id} className="border-l-4 border-amber-500 pl-4 py-2">
                  <p className="font-bold text-slate-900 dark:text-white">{app.candidateName}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-2">
                    {app.jobTitle} • {new Date(app.updatedAt || app.createdAt).toLocaleDateString()}
                  </p>
                  <button className="text-[10px] font-black text-white bg-slate-900 dark:bg-slate-800 px-3 py-1 rounded-lg uppercase tracking-widest">Details</button>
                </div>
              ))
            ) : (
              <p className="text-slate-400 text-sm font-bold italic">No interviews scheduled.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
