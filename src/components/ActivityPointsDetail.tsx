import React from 'react';
import { UserProfile, Task } from '../types';
import { Trophy, TrendingUp, Calendar, ArrowLeft, BarChart3 } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { formatPoints, cn } from '../utils';
import { motion } from 'motion/react';

interface ActivityPointsDetailProps {
  teamMembers: UserProfile[];
  allTasks: Task[];
  onBack: () => void;
}

export default function ActivityPointsDetail({ teamMembers, allTasks, onBack }: ActivityPointsDetailProps) {
  const averagePoints = teamMembers.length > 0 
    ? Math.round(teamMembers.reduce((acc, m) => acc + (m.activityPoints || 0), 0) / teamMembers.length)
    : 0;

  // Calculate weekly and monthly averages
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const completedTasks = allTasks.filter(t => t.status === 'completed' && t.completedAt);
  
  const weeklyPoints = completedTasks
    .filter(t => new Date(t.completedAt!) >= sevenDaysAgo)
    .reduce((acc, t) => acc + (t.earnedPoints || 0), 0);
    
  const monthlyPoints = completedTasks
    .filter(t => new Date(t.completedAt!) >= thirtyDaysAgo)
    .reduce((acc, t) => acc + (t.earnedPoints || 0), 0);

  const weeklyAvg = teamMembers.length > 0 ? Math.round(weeklyPoints / teamMembers.length) : 0;
  const monthlyAvg = teamMembers.length > 0 ? Math.round(monthlyPoints / teamMembers.length) : 0;

  // Data for points per member chart
  const memberData = [...teamMembers]
    .sort((a, b) => (b.activityPoints || 0) - (a.activityPoints || 0))
    .slice(0, 10)
    .map(m => ({
      name: m.fullName || m.displayName,
      points: m.activityPoints || 0
    }));

  // Data for activity trend (last 7 days)
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const trendData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(now.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const points = completedTasks
      .filter(t => t.completedAt?.startsWith(dateStr))
      .reduce((acc, t) => acc + (t.earnedPoints || 0), 0);
    
    return {
      name: days[d.getDay()],
      points
    };
  });

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
          <h2 className="text-4xl font-black text-white tracking-tight">Activity Points Detail</h2>
          <p className="text-white/60 font-medium mt-1 text-lg">In-depth analysis of your team's performance.</p>
        </div>
      </header>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-pink-400 to-rose-600 text-white shadow-xl relative overflow-hidden group">
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30">
                <Trophy size={24} />
              </div>
              <h3 className="font-bold text-white/90 uppercase tracking-widest text-sm">Team Average</h3>
            </div>
            <p className="text-5xl font-black">{formatPoints(averagePoints)}</p>
            <p className="text-sm text-white/60 mt-2 font-medium">Overall average per member</p>
          </div>
          <Trophy className="absolute -bottom-6 -right-6 w-32 h-32 opacity-10 text-white group-hover:scale-110 transition-transform duration-700" />
        </div>

        <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-blue-400 to-indigo-600 text-white shadow-xl relative overflow-hidden group">
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30">
                <TrendingUp size={24} />
              </div>
              <h3 className="font-bold text-white/90 uppercase tracking-widest text-sm">Weekly Average</h3>
            </div>
            <p className="text-5xl font-black">{formatPoints(weeklyAvg)}</p>
            <p className="text-sm text-white/60 mt-2 font-medium">Average points earned this week</p>
          </div>
          <TrendingUp className="absolute -bottom-6 -right-6 w-32 h-32 opacity-10 text-white group-hover:scale-110 transition-transform duration-700" />
        </div>

        <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-purple-400 to-violet-600 text-white shadow-xl relative overflow-hidden group">
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30">
                <Calendar size={24} />
              </div>
              <h3 className="font-bold text-white/90 uppercase tracking-widest text-sm">Monthly Average</h3>
            </div>
            <p className="text-5xl font-black">{formatPoints(monthlyAvg)}</p>
            <p className="text-sm text-white/60 mt-2 font-medium">Average points earned this month</p>
          </div>
          <Calendar className="absolute -bottom-6 -right-6 w-32 h-32 opacity-10 text-white group-hover:scale-110 transition-transform duration-700" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Points per Member Chart */}
        <div className="glass-card p-8 shadow-2xl border border-white/10 bg-white/5 backdrop-blur-3xl">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-black text-white">Points per Member</h3>
            <div className="p-2 bg-white/10 rounded-xl text-white/40 border border-white/10">
              <BarChart3 size={20} />
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={memberData} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 600 }}
                  width={100}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                  contentStyle={{ 
                    backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                    backdropFilter: 'blur(12px)',
                    borderRadius: '20px', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: '0 10px 30px -10px rgba(0,0,0,0.3)',
                    color: '#fff'
                  }}
                />
                <Bar dataKey="points" radius={[0, 12, 12, 0]} barSize={28}>
                  {memberData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#6366f1' : '#818cf8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Activity Trend Chart */}
        <div className="glass-card p-8 shadow-2xl border border-white/10 bg-white/5 backdrop-blur-3xl">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-black text-white">Activity Trend</h3>
            <div className="p-2 bg-white/10 rounded-xl text-white/40 border border-white/10">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 600 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 600 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                    backdropFilter: 'blur(12px)',
                    borderRadius: '20px', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: '0 10px 30px -10px rgba(0,0,0,0.3)',
                    color: '#fff'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="points" 
                  stroke="#6366f1" 
                  strokeWidth={5} 
                  dot={{ r: 6, fill: '#6366f1', strokeWidth: 3, stroke: '#fff' }}
                  activeDot={{ r: 10, fill: '#6366f1', strokeWidth: 4, stroke: '#fff' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Ranking List */}
      <div className="glass-card overflow-hidden shadow-2xl border border-white/10 bg-white/5 backdrop-blur-3xl">
        <div className="p-8 border-b border-white/10">
          <h3 className="text-2xl font-black text-white">Activity Points Ranking</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-white/5">
                <th className="px-8 py-5 text-left text-xs font-black text-white/40 uppercase tracking-widest">Rank</th>
                <th className="px-8 py-5 text-left text-xs font-black text-white/40 uppercase tracking-widest">Member</th>
                <th className="px-8 py-5 text-left text-xs font-black text-white/40 uppercase tracking-widest">Roll Number</th>
                <th className="px-8 py-5 text-right text-xs font-black text-white/40 uppercase tracking-widest">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {teamMembers
                .sort((a, b) => (b.activityPoints || 0) - (a.activityPoints || 0))
                .map((member, index) => (
                  <tr key={member.uid} className="hover:bg-white/5 transition-colors group">
                    <td className="px-8 py-6">
                      <div className={cn(
                        "w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shadow-sm",
                        index === 0 ? "bg-amber-500/20 text-amber-400 border border-amber-500/20" :
                        index === 1 ? "bg-white/10 text-white/60 border border-white/20" :
                        index === 2 ? "bg-orange-500/20 text-orange-400 border border-orange-500/20" :
                        "bg-white/5 text-white/40 border border-white/10"
                      )}>
                        {index + 1}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <img 
                          src={member.photoURL || `https://picsum.photos/seed/${member.uid}/120/120`} 
                          alt={member.displayName}
                          className="w-12 h-12 rounded-2xl border-2 border-white/20 shadow-md object-cover group-hover:scale-105 transition-transform"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <p className="font-black text-white">{member.fullName || member.displayName}</p>
                          <p className="text-xs text-white/40 font-bold uppercase tracking-widest">{member.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 font-bold text-sm text-white/40">
                      {member.rollNumber || 'N/A'}
                    </td>
                    <td className="px-8 py-6 text-right">
                      <span className="px-4 py-2 bg-indigo-500/20 text-indigo-400 rounded-xl font-black text-sm border border-indigo-500/20">
                        {formatPoints(member.activityPoints || 0)}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
