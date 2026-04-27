import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { Loader2, Plus, Trash2, Wand2 } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Builder() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [isBuilding, setIsBuilding] = useState(false);
  const [error, setError] = useState('');

  const [personal, setPersonal] = useState({
    name: '', email: '', phone: '', location: '', linkedin: '', github: ''
  });

  const [experience, setExperience] = useState([{ company: '', title: '', date: '', location: '', description: '' }]);
  const [education, setEducation] = useState([{ school: '', degree: '', date: '', location: '', details: '' }]);
  const [projects, setProjects] = useState([{ name: '', technologies: '', date: '', description: '' }]);
  const [skills, setSkills] = useState({ languages: '', frameworks: '', tools: '' });
  const [jobDescription, setJobDescription] = useState('');

  const handleBuild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setIsBuilding(true);
    setError('');

    // Format skills cleanly
    const formattedSkills = {
      languages: skills.languages.split(',').map(s => s.trim()).filter(Boolean),
      frameworks: skills.frameworks.split(',').map(s => s.trim()).filter(Boolean),
      tools: skills.tools.split(',').map(s => s.trim()).filter(Boolean),
    };

    // Format experience/projects bullets roughly
    const formattedExperience = experience.map(exp => ({
      ...exp,
      bullets: exp.description.split('\n').filter(Boolean)
    }));

    const formattedProjects = projects.map(proj => ({
      ...proj,
      bullets: proj.description.split('\n').filter(Boolean)
    }));

    try {
      const apiUrl = import.meta.env.VITE_APP_URL || '';
      const response = await fetch(`${apiUrl}/api/resume/build`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          personalData: personal,
          experienceData: formattedExperience,
          educationData: education,
          projectsData: formattedProjects,
          skillsData: formattedSkills,
          jobDescription
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to build resume');
      }

      const data = await response.json();
      navigate(`/resume/${data.id}`);
    } catch (err: any) {
      setError(err.message || 'An error occurred while building the resume.');
    } finally {
      setIsBuilding(false);
    }
  };

  const updateArrayField = (setter: any, index: number, field: string, value: string) => {
    setter((prev: any[]) => {
      const newArray = [...prev];
      newArray[index] = { ...newArray[index], [field]: value };
      return newArray;
    });
  };

  const removeArrayItem = (setter: any, index: number) => {
    setter((prev: any[]) => prev.filter((_, i) => i !== index));
  };

  const addArrayItem = (setter: any, emptyItem: any) => {
    setter((prev: any[]) => [...prev, emptyItem]);
  };

  return (
    <div className="max-w-4xl mx-auto pb-20 fade-in">
      <header className="mb-8">
        <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-none mb-2 transition-colors">AI Resume Builder</h2>
        <p className="text-slate-500 dark:text-slate-400 font-medium">Provide your raw details, and our AI will craft a perfectly ATS-optimized resume.</p>
      </header>

      {error && (
        <div className="bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 font-bold p-4 rounded-xl border-2 border-rose-200 dark:border-rose-900/50 mb-6 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="p-1 hover:bg-rose-100 dark:hover:bg-rose-900/50 rounded">✕</button>
        </div>
      )}

      <form onSubmit={handleBuild} className="space-y-8">
        {/* Personal Info */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border-2 border-slate-900 dark:border-slate-800 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] dark:shadow-[8px_8px_0px_0px_rgba(15,23,42,0.5)] transition-colors">
          <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6 uppercase tracking-tight">Personal Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {['name', 'email', 'phone', 'location', 'linkedin', 'github'].map(field => (
              <div key={field}>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">{field}</label>
                <input
                  type={field === 'email' ? 'email' : 'text'}
                  required={field === 'name' || field === 'email'}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-500 font-medium text-slate-900 dark:text-white transition-colors"
                  value={(personal as any)[field]}
                  onChange={(e) => setPersonal(prev => ({ ...prev, [field]: e.target.value }))}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Experience */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border-2 border-slate-900 dark:border-slate-800 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] dark:shadow-[8px_8px_0px_0px_rgba(15,23,42,0.5)] transition-colors">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Experience</h3>
            <button type="button" onClick={() => addArrayItem(setExperience, { company: '', title: '', date: '', location: '', description: '' })} className="flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest hover:text-indigo-800">
              <Plus className="w-4 h-4" /> Add Next
            </button>
          </div>
          <div className="space-y-6">
            {experience.map((exp, i) => (
              <div key={i} className="p-4 bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-2xl relative">
                <button type="button" onClick={() => removeArrayItem(setExperience, i)} className="absolute top-4 right-4 text-slate-400 hover:text-rose-500">
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 pr-8">
                  <input placeholder="Company" required className="w-full px-4 py-3 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 font-medium text-slate-900 dark:text-white text-sm" value={exp.company} onChange={e => updateArrayField(setExperience, i, 'company', e.target.value)} />
                  <input placeholder="Job Title" required className="w-full px-4 py-3 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 font-medium text-slate-900 dark:text-white text-sm" value={exp.title} onChange={e => updateArrayField(setExperience, i, 'title', e.target.value)} />
                  <input placeholder="Dates (e.g. Jan 2020 - Present)" className="w-full px-4 py-3 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 font-medium text-slate-900 dark:text-white text-sm" value={exp.date} onChange={e => updateArrayField(setExperience, i, 'date', e.target.value)} />
                  <input placeholder="Location" className="w-full px-4 py-3 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 font-medium text-slate-900 dark:text-white text-sm" value={exp.location} onChange={e => updateArrayField(setExperience, i, 'location', e.target.value)} />
                </div>
                <textarea placeholder="Raw responsibilities & achievements (one per line). AI will optimize them..." className="w-full px-4 py-3 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 font-medium text-slate-900 dark:text-white min-h-[100px] text-sm" value={exp.description} onChange={e => updateArrayField(setExperience, i, 'description', e.target.value)} />
              </div>
            ))}
          </div>
        </section>

        {/* Education */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border-2 border-slate-900 dark:border-slate-800 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] dark:shadow-[8px_8px_0px_0px_rgba(15,23,42,0.5)] transition-colors">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Education</h3>
            <button type="button" onClick={() => addArrayItem(setEducation, { school: '', degree: '', date: '', location: '', details: '' })} className="flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest hover:text-indigo-800">
              <Plus className="w-4 h-4" /> Add Next
            </button>
          </div>
          <div className="space-y-6">
            {education.map((edu, i) => (
              <div key={i} className="p-4 bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-2xl relative">
                <button type="button" onClick={() => removeArrayItem(setEducation, i)} className="absolute top-4 right-4 text-slate-400 hover:text-rose-500">
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 pr-8">
                  <input placeholder="School / University" required className="w-full px-4 py-3 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 font-medium text-slate-900 dark:text-white text-sm" value={edu.school} onChange={e => updateArrayField(setEducation, i, 'school', e.target.value)} />
                  <input placeholder="Degree (e.g. BS Computer Science)" required className="w-full px-4 py-3 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 font-medium text-slate-900 dark:text-white text-sm" value={edu.degree} onChange={e => updateArrayField(setEducation, i, 'degree', e.target.value)} />
                  <input placeholder="Graduation Date" className="w-full px-4 py-3 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 font-medium text-slate-900 dark:text-white text-sm" value={edu.date} onChange={e => updateArrayField(setEducation, i, 'date', e.target.value)} />
                  <input placeholder="Location" className="w-full px-4 py-3 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 font-medium text-slate-900 dark:text-white text-sm" value={edu.location} onChange={e => updateArrayField(setEducation, i, 'location', e.target.value)} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Projects */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border-2 border-slate-900 dark:border-slate-800 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] dark:shadow-[8px_8px_0px_0px_rgba(15,23,42,0.5)] transition-colors">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Projects</h3>
            <button type="button" onClick={() => addArrayItem(setProjects, { name: '', technologies: '', date: '', description: '' })} className="flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest hover:text-indigo-800">
              <Plus className="w-4 h-4" /> Add Next
            </button>
          </div>
          <div className="space-y-6">
            {projects.map((proj, i) => (
              <div key={i} className="p-4 bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-2xl relative">
                <button type="button" onClick={() => removeArrayItem(setProjects, i)} className="absolute top-4 right-4 text-slate-400 hover:text-rose-500">
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 pr-8">
                  <input placeholder="Project Name" className="w-full px-4 py-3 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 font-medium text-slate-900 dark:text-white text-sm" value={proj.name} onChange={e => updateArrayField(setProjects, i, 'name', e.target.value)} />
                  <input placeholder="Technologies (e.g. React, Node.js)" className="w-full px-4 py-3 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 font-medium text-slate-900 dark:text-white text-sm" value={proj.technologies} onChange={e => updateArrayField(setProjects, i, 'technologies', e.target.value)} />
                </div>
                <textarea placeholder="Description & achievements (one per line)" className="w-full px-4 py-3 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 font-medium text-slate-900 dark:text-white min-h-[100px] text-sm" value={proj.description} onChange={e => updateArrayField(setProjects, i, 'description', e.target.value)} />
              </div>
            ))}
          </div>
        </section>

        {/* Skills */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border-2 border-slate-900 dark:border-slate-800 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] dark:shadow-[8px_8px_0px_0px_rgba(15,23,42,0.5)] transition-colors">
          <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-6">Skills</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Languages (comma separated)</label>
              <input className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 font-medium text-slate-900 dark:text-white text-sm" value={skills.languages} onChange={(e) => setSkills(s => ({ ...s, languages: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Frameworks & Libraries (comma separated)</label>
              <input className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 font-medium text-slate-900 dark:text-white text-sm" value={skills.frameworks} onChange={(e) => setSkills(s => ({ ...s, frameworks: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Tools & Platforms (comma separated)</label>
              <input className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 font-medium text-slate-900 dark:text-white text-sm" value={skills.tools} onChange={(e) => setSkills(s => ({ ...s, tools: e.target.value }))} />
            </div>
          </div>
        </section>

        {/* Job Description (Optional) */}
        <section className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border-2 border-slate-900 dark:border-slate-800 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] dark:shadow-[8px_8px_0px_0px_rgba(15,23,42,0.5)] transition-colors">
          <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">Target Job Description (Optional)</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-4">Paste the JD to heavily optimize the resume towards it.</p>
          <textarea className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 font-medium text-slate-900 dark:text-white min-h-[150px] text-sm" value={jobDescription} onChange={e => setJobDescription(e.target.value)} />
        </section>

        <button 
          type="submit" 
          disabled={isBuilding}
          className="w-full py-5 px-8 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-[0_8px_20px_-8px_rgba(79,70,229,0.8)] hover:bg-indigo-700 hover:-translate-y-1 transition-all disabled:opacity-50 disabled:transform-none flex justify-center items-center gap-3 text-lg"
        >
          {isBuilding ? <><Loader2 className="w-6 h-6 animate-spin" /> Crafting your resume...</> : <><Wand2 className="w-6 h-6" /> Generate AI Resume</>}
        </button>
      </form>
    </div>
  );
}
