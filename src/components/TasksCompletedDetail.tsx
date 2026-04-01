import React, { useState } from 'react';
import { UserProfile, Task } from '../types';
import { CheckCircle2, Filter, Search, ArrowLeft, Calendar, User, Clock } from 'lucide-react';
import { cn } from '../utils';
import { format } from 'date-fns';

interface TasksCompletedDetailProps {
  teamMembers: UserProfile[];
  allTasks: Task[];
  onBack: () => void;
}

export default function TasksCompletedDetail({ teamMembers, allTasks, onBack }: TasksCompletedDetailProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMember, setSelectedMember] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  const completedTasks = allTasks
    .filter(t => t.status === 'completed')
    .sort((a, b) => new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime());

  const filteredTasks = completedTasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMember = selectedMember === 'all' || task.authorId === selectedMember;
    
    let matchesDate = true;
    if (dateFilter !== 'all' && task.completedAt) {
      const taskDate = new Date(task.completedAt);
      const now = new Date();
      if (dateFilter === 'today') {
        matchesDate = taskDate.toDateString() === now.toDateString();
      } else if (dateFilter === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        matchesDate = taskDate >= weekAgo;
      } else if (dateFilter === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        matchesDate = taskDate >= monthAgo;
      }
    }

    return matchesSearch && matchesMember && matchesDate;
  });

  const tasksByMember = teamMembers.map(member => ({
    ...member,
    count: completedTasks.filter(t => t.authorId === member.uid).length
  })).sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex items-center gap-6">
        <button 
          onClick={onBack}
          className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all text-white shadow-sm border border-white/10 backdrop-blur-md"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h2 className="text-4xl font-black text-white tracking-tight">Tasks Completed</h2>
          <p className="text-white/60 font-medium mt-1 text-lg">Track and review all finished assignments.</p>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-emerald-400 to-teal-600 text-white shadow-xl relative overflow-hidden group">
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30">
                <CheckCircle2 size={24} />
              </div>
              <h3 className="font-bold text-white/90 uppercase tracking-widest text-sm">Total Completed</h3>
            </div>
            <p className="text-5xl font-black">{completedTasks.length}</p>
          </div>
          <CheckCircle2 className="absolute -bottom-6 -right-6 w-32 h-32 opacity-10 text-white group-hover:scale-110 transition-transform duration-700" />
        </div>

        {tasksByMember.slice(0, 3).map((m, i) => (
          <div key={m.uid} className="p-8 rounded-[2.5rem] bg-white/5 backdrop-blur-3xl border border-white/10 shadow-xl relative overflow-hidden group">
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-6">
                <img 
                  src={m.photoURL || `https://picsum.photos/seed/${m.uid}/120/120`} 
                  alt={m.displayName}
                  className="w-12 h-12 rounded-2xl border-2 border-white/20 shadow-md object-cover"
                  referrerPolicy="no-referrer"
                />
                <h3 className="font-black text-white truncate text-lg">{m.fullName || m.displayName}</h3>
              </div>
              <p className="text-5xl font-black text-white">{m.count}</p>
              <p className="text-xs text-white/40 font-bold uppercase tracking-widest mt-2">Tasks completed</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="glass-card p-8 flex flex-col md:flex-row gap-6 shadow-2xl border border-white/10 bg-white/5 backdrop-blur-3xl">
        <div className="relative flex-1">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/40" size={20} />
          <input 
            type="text"
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="glass-input w-full pl-14 pr-6 py-4 text-lg bg-white/5 border-white/10 text-white placeholder:text-white/20"
          />
        </div>
        <div className="flex gap-4">
          <div className="relative">
            <User className="absolute left-5 top-1/2 -translate-y-1/2 text-white/40" size={20} />
            <select 
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
              className="glass-input pl-14 pr-12 py-4 appearance-none cursor-pointer min-w-[200px] text-lg font-bold bg-white/5 border-white/10 text-white"
            >
              <option value="all" className="bg-slate-900">All Members</option>
              {teamMembers.map(m => (
                <option key={m.uid} value={m.uid} className="bg-slate-900">{m.fullName || m.displayName}</option>
              ))}
            </select>
          </div>
          <div className="relative">
            <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-white/40" size={20} />
            <select 
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="glass-input pl-14 pr-12 py-4 appearance-none cursor-pointer min-w-[200px] text-lg font-bold bg-white/5 border-white/10 text-white"
            >
              <option value="all" className="bg-slate-900">All Time</option>
              <option value="today" className="bg-slate-900">Today</option>
              <option value="week" className="bg-slate-900">This Week</option>
              <option value="month" className="bg-slate-900">This Month</option>
            </select>
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="glass-card overflow-hidden shadow-2xl border border-white/10 bg-white/5 backdrop-blur-3xl">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-white/5">
                <th className="px-8 py-5 text-left text-xs font-black text-white/40 uppercase tracking-widest">Task</th>
                <th className="px-8 py-5 text-left text-xs font-black text-white/40 uppercase tracking-widest">Completed By</th>
                <th className="px-8 py-5 text-left text-xs font-black text-white/40 uppercase tracking-widest">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredTasks.length > 0 ? (
                filteredTasks.map((task) => {
                  const member = teamMembers.find(m => m.uid === task.authorId);
                  return (
                    <tr key={task.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-8 py-6">
                        <div>
                          <p className="font-black text-white text-lg">{task.title}</p>
                          <p className="text-sm text-white/40 font-medium mt-1 line-clamp-1">{task.description}</p>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <img 
                            src={member?.photoURL || `https://picsum.photos/seed/${task.authorId}/120/120`} 
                            alt={member?.displayName}
                            className="w-10 h-10 rounded-2xl border-2 border-white/20 shadow-md object-cover group-hover:scale-105 transition-transform"
                            referrerPolicy="no-referrer"
                          />
                          <p className="font-bold text-white/80">{member?.fullName || member?.displayName || 'Unknown'}</p>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3 text-white/40 text-sm font-bold">
                          <div className="p-2 bg-white/5 rounded-xl text-white/20 border border-white/10">
                            <Clock size={16} />
                          </div>
                          {task.completedAt ? format(new Date(task.completedAt), 'MMM d, yyyy HH:mm') : 'N/A'}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={3} className="px-8 py-24 text-center">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 text-white/20 border border-white/10">
                      <CheckCircle2 size={40} />
                    </div>
                    <h3 className="text-xl font-black text-white">No completed tasks found</h3>
                    <p className="text-white/40 mt-2 font-medium">Try adjusting your search or filters.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
