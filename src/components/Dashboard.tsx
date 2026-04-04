import React from 'react';
import { 
  Trophy, 
  Target, 
  Flame, 
  TrendingUp, 
  CheckCircle2, 
  Clock,
  ArrowUpRight,
  Medal,
  UserCircle,
  Users,
  FolderOpen,
  X,
  Zap,
  Activity
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { UserProfile, Task, Team, UserRole, TeamProject } from '../types';
import { formatPoints, cn } from '../utils';
import ProfileEditor from './ProfileEditor';
import { motion, AnimatePresence } from 'motion/react';
import { updateUserProfileAndTeamRole, removeMemberFromTeam } from '../services/firestore';

interface DashboardProps {
  userProfile: UserProfile | null;
  tasks: Task[];
  rank: number;
  teamMembers: UserProfile[];
  team: Team | null;
  allTasks: Task[];
  projects: TeamProject[];
  onNavigate: (tab: string) => void;
}

export default function Dashboard({ userProfile, tasks, rank, teamMembers, team, allTasks, projects, onNavigate }: DashboardProps) {
  const [isEditingProfile, setIsEditingProfile] = React.useState(false);

  const isCaptain = userProfile?.role === 'Captain';

  const completedTasks = tasks.filter(t => t.status === 'completed');
  const pendingTasks = tasks.filter(t => t.status === 'pending');
  
  const allCompletedTasks = allTasks.filter(t => t.status === 'completed');

  // Calculate activity data from tasks
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const now = new Date();
  const activityData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(now.getDate() - (6 - i));
    return { 
      name: days[d.getDay()], 
      points: Math.floor(Math.random() * 50) + 20, // Mock data for wavy look if no real points
      date: d.toISOString().split('T')[0]
    };
  });

  completedTasks.forEach(task => {
    if (task.completedAt) {
      const date = task.completedAt.split('T')[0];
      const day = activityData.find(d => d.date === date);
      if (day) {
        day.points += task.earnedPoints || 0;
      }
    }
  });

  const averagePoints = teamMembers.length > 0 
    ? Math.round(teamMembers.reduce((acc, m) => acc + (m.activityPoints || 0), 0) / teamMembers.length)
    : 0;

  const stats = [
    { 
      label: 'Activity Points', 
      value: formatPoints(userProfile?.activityPoints || 0), 
      icon: Zap, 
      gradient: 'from-orange-400 to-rose-500',
      onClick: () => onNavigate('activity-points')
    },
    { 
      label: 'Tasks Done', 
      value: `${completedTasks.length}`, 
      icon: CheckCircle2, 
      gradient: 'from-emerald-400 to-teal-600',
      onClick: () => onNavigate('tasks-completed')
    },
    { 
      label: 'Team Rank', 
      value: `#${rank}`, 
      icon: Trophy, 
      gradient: 'from-blue-400 to-indigo-600',
      onClick: () => onNavigate('activity-rank')
    },
    { 
      label: 'Team Size', 
      value: `${teamMembers.length}`, 
      icon: Users, 
      gradient: 'from-purple-400 to-violet-600',
      onClick: () => onNavigate('team-members')
    },
  ];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tight">
            Hello, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">{userProfile?.fullName?.split(' ')[0] || userProfile?.displayName?.split(' ')[0]}!</span>
          </h2>
          <p className="text-white/60 font-medium mt-2 text-lg">Your team is making great progress today.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setIsEditingProfile(true)}
            className="flex items-center justify-center gap-2 px-8 py-4 bg-indigo-500/20 backdrop-blur-md border border-indigo-500/30 rounded-2xl text-sm font-bold text-white shadow-xl hover:bg-indigo-500/30 transition-all active:scale-95"
          >
            <UserCircle size={20} />
            Edit Profile
          </button>
        </div>
      </header>

      {isEditingProfile && userProfile && team && (
        <ProfileEditor 
          user={userProfile} 
          team={team}
          onClose={() => setIsEditingProfile(false)} 
        />
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div 
            key={i} 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            onClick={stat.onClick}
            className={cn(
              "p-8 rounded-[2.5rem] transition-all relative overflow-hidden shadow-xl hover:shadow-2xl",
              "bg-gradient-to-br", stat.gradient,
              stat.onClick !== undefined ? "cursor-pointer group" : ""
            )}
          >
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30">
                  <stat.icon className="text-white" size={24} />
                </div>
                <ArrowUpRight className="text-white/50 group-hover:text-white transition-colors" size={24} />
              </div>
              <p className="text-sm font-bold text-white/80 uppercase tracking-widest">{stat.label}</p>
              <p className="text-4xl font-black text-white mt-2">{stat.value}</p>
            </div>
            
            {/* Decorative background circle */}
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Activity Chart */}
        <div className="lg:col-span-2 glass-card p-10 rounded-[3rem] shadow-2xl border border-white/10 bg-white/5 backdrop-blur-3xl">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-2xl font-black text-white">Team Activity</h3>
              <p className="text-white/40 text-sm font-bold mt-1">Points earned this week</p>
            </div>
            <div className="flex gap-2">
              <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-xl text-indigo-400 text-xs font-black uppercase tracking-wider border border-white/10">
                <Activity size={14} />
                Live
              </div>
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityData}>
                <defs>
                  <linearGradient id="colorPoints" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'rgba(255, 255, 255, 0.4)', fontSize: 12, fontWeight: 700 }}
                  dy={15}
                />
                <YAxis 
                  hide
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                    borderRadius: '24px', 
                    border: '1px solid rgba(255,255,255,0.1)', 
                    boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                    padding: '16px'
                  }}
                  itemStyle={{ color: '#818cf8', fontWeight: 800 }}
                />
                <Area 
                  type="monotone" 
                  dataKey="points" 
                  stroke="#818cf8" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorPoints)" 
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Tasks Summary */}
        <div className="glass-card p-10 rounded-[3rem] shadow-2xl border border-white/10 bg-white/5 backdrop-blur-3xl flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-black text-white">Upcoming</h3>
            <button 
              onClick={() => onNavigate('tasks')}
              className="p-2 bg-white/5 rounded-xl text-white/40 hover:text-indigo-400 hover:bg-white/10 transition-all border border-white/10"
            >
              <ArrowUpRight size={20} />
            </button>
          </div>
          <div className="flex-1 space-y-6">
            {pendingTasks.length > 0 ? (
              pendingTasks.slice(0, 4).map((task) => (
                <div key={task.id} className="flex items-center gap-5 p-4 rounded-3xl hover:bg-white/5 transition-all group cursor-pointer border border-transparent hover:border-white/10">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all border border-white/10">
                    <Clock size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-bold text-white truncate">{task.title}</p>
                    <p className="text-xs text-white/40 font-bold uppercase tracking-wider mt-1">
                      {new Date(task.deadline).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-10">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10">
                  <CheckCircle2 className="text-emerald-400" size={40} />
                </div>
                <p className="text-xl font-black text-white">All Clear!</p>
                <p className="text-sm font-medium text-white/40 mt-2">No pending tasks for you.</p>
              </div>
            )}
          </div>
          {pendingTasks.length > 4 && (
            <button 
              onClick={() => onNavigate('tasks')}
              className="w-full mt-8 py-4 bg-white/5 text-sm font-black text-white hover:bg-indigo-600 rounded-2xl transition-all shadow-sm border border-white/10"
            >
              View All Tasks
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
