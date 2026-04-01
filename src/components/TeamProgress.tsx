import React from 'react';
import { 
  Users, 
  Target, 
  TrendingUp, 
  CheckCircle2, 
  Clock,
  ArrowUpRight,
  PieChart as PieChartIcon,
  Activity,
  Settings,
  Edit2,
  Copy,
  Check,
  X,
  LogOut,
  Hash
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip,
  Legend,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import { Team, UserProfile, Task } from '../types';
import { formatPoints, cn } from '../utils';
import { updateTeam, updateUserProfile, getTeam, createTeam, removeMemberFromTeam } from '../services/firestore';
import UserProfileCard from './UserProfileCard';
import { motion, AnimatePresence } from 'motion/react';

interface TeamProgressProps {
  team: Team | null;
  members: UserProfile[];
  allTasks: Task[];
  currentUser: UserProfile | null;
}

export default function TeamProgress({ team, members, allTasks, currentUser }: TeamProgressProps) {
  const [isEditingName, setIsEditingName] = React.useState(false);
  const [newTeamName, setNewTeamName] = React.useState(team?.name || '');
  const [copied, setCopied] = React.useState(false);
  const [joinTeamId, setJoinTeamId] = React.useState('');
  const [isJoining, setIsJoining] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<UserProfile | null>(null);
  const [showLeaveConfirm, setShowLeaveConfirm] = React.useState(false);
  const [isLeaving, setIsLeaving] = React.useState(false);

  const handleLeaveTeam = async () => {
    if (!currentUser || !team) return;
    
    if (currentUser.role === 'Captain') {
      alert("As Captain, you cannot leave the team without assigning a new Captain first. Please promote another member to Captain in the Team Directory.");
      setShowLeaveConfirm(false);
      return;
    }

    setIsLeaving(true);
    try {
      await removeMemberFromTeam(currentUser.uid, team.id, currentUser.role || 'Member');
      setShowLeaveConfirm(false);
    } catch (err) {
      console.error('Error leaving team:', err);
    } finally {
      setIsLeaving(false);
    }
  };

  const completedTasks = allTasks.filter(t => t.status === 'completed');
  const pendingTasks = allTasks.filter(t => t.status === 'pending');
  
  const taskDistribution = [
    { name: 'Completed', value: completedTasks.length, color: '#10b981' },
    { name: 'Pending', value: pendingTasks.length, color: '#f59e0b' },
  ];

  const memberContributions = members.map(m => ({
    ...m,
    points: m.activityPoints || 0,
  })).sort((a, b) => b.points - a.points);

  const totalTeamActivityPoints = members.reduce((acc, m) => acc + (m.activityPoints || 0), 0);

  // Calculate team growth data from allTasks
  const now = new Date();
  const growthData = Array.from({ length: 5 }, (_, i) => {
    const d = new Date();
    d.setDate(now.getDate() - (4 - i) * 7);
    return { 
      name: `Week ${i + 1}`, 
      points: 0,
    };
  });

  allTasks.forEach(task => {
    if (task.status === 'completed' && task.completedAt) {
      const taskDate = new Date(task.completedAt);
      for (let i = 0; i < 5; i++) {
        const weekDate = new Date();
        weekDate.setDate(now.getDate() - (4 - i) * 7);
        if (taskDate <= weekDate) {
          growthData[i].points += task.earnedPoints || 0;
        }
      }
    }
  });

  const handleUpdateTeamName = async () => {
    if (!team || !newTeamName.trim()) return;
    await updateTeam(team.id, { name: newTeamName });
    setIsEditingName(false);
  };

  const copyTeamId = () => {
    if (!team) return;
    navigator.clipboard.writeText(team.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 animate-in zoom-in-95 duration-500">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  className="text-3xl font-bold text-white bg-white/5 border-b-2 border-pink-500 outline-none px-2"
                  autoFocus
                />
                <button onClick={handleUpdateTeamName} className="p-2 text-emerald-400 hover:bg-emerald-500/10 rounded-lg">
                  <Check size={24} />
                </button>
                <button onClick={() => setIsEditingName(false)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg">
                  <X size={24} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 group">
                <h2 className="text-3xl font-bold text-white">{team?.name || 'Team Progress'}</h2>
                <button 
                  onClick={() => {
                    setNewTeamName(team?.name || '');
                    setIsEditingName(true);
                  }}
                  className="p-2 text-white/40 opacity-0 group-hover:opacity-100 hover:text-pink-400 hover:bg-white/5 rounded-lg transition-all"
                >
                  <Edit2 size={20} />
                </button>
              </div>
            )}
          </div>
          <p className="text-white/60 mt-1">Overview of your team's collective achievements.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 flex items-center gap-3">
            <span className="text-xs font-bold text-white/40 uppercase">Team ID:</span>
            <code className="text-sm font-mono text-white/60">{team?.id}</code>
            <button onClick={copyTeamId} className="text-white/40 hover:text-pink-400 transition-colors">
              {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
            </button>
          </div>
          <button 
            onClick={() => setShowLeaveConfirm(true)}
            className="flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-xl text-sm font-bold transition-colors"
          >
            <LogOut size={18} />
            Leave Team
          </button>
        </div>
      </header>

      {/* Leave Confirmation Modal */}
      <AnimatePresence>
        {showLeaveConfirm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card w-full max-w-sm p-8"
            >
              <h3 className="text-xl font-bold text-white mb-2">Leave Team?</h3>
              <p className="text-white/60 text-sm mb-8">
                Are you sure you want to leave <span className="font-bold text-white">{team?.name}</span>? You will lose access to team chat and tasks.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowLeaveConfirm(false)}
                  className="flex-1 glass-button px-6 py-3"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleLeaveTeam}
                  disabled={isLeaving}
                  className="flex-1 py-3 rounded-2xl font-bold bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {isLeaving ? 'Leaving...' : 'Leave'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Team Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 border border-white/10 bg-white/5 backdrop-blur-3xl">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-pink-500/20 rounded-2xl border border-pink-500/20">
              <Users className="text-pink-400" size={24} />
            </div>
          </div>
          <p className="text-sm font-medium text-white/40">Team Size</p>
          <p className="text-2xl font-bold text-white mt-1">{members.length} Members</p>
        </div>

        <div className="glass-card p-6 border border-white/10 bg-white/5 backdrop-blur-3xl">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-500/20 rounded-2xl border border-blue-500/20">
              <Target className="text-blue-400" size={24} />
            </div>
          </div>
          <p className="text-sm font-medium text-white/40">Total Tasks</p>
          <p className="text-2xl font-bold text-white mt-1">{allTasks.length} Assigned</p>
        </div>

        <div className="glass-card p-6 border border-white/10 bg-white/5 backdrop-blur-3xl">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-500/20 rounded-2xl border border-emerald-500/20">
              <TrendingUp className="text-emerald-400" size={24} />
            </div>
          </div>
          <p className="text-sm font-medium text-white/40">Collective Activity Points</p>
          <p className="text-2xl font-bold text-white mt-1">{formatPoints(totalTeamActivityPoints)} pts</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Task Completion Distribution */}
        <div className="glass-card p-8 border border-white/10 bg-white/5 backdrop-blur-3xl">
          <h3 className="text-lg font-bold text-white mb-8 flex items-center gap-2">
            <PieChartIcon size={20} className="text-pink-500" />
            Task Distribution
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={taskDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {taskDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(20, 20, 20, 0.8)', 
                    backdropFilter: 'blur(12px)',
                    borderRadius: '16px', 
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#fff'
                  }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Team Growth Chart */}
        <div className="glass-card p-8 border border-white/10 bg-white/5 backdrop-blur-3xl">
          <h3 className="text-lg font-bold text-white mb-8 flex items-center gap-2">
            <Activity size={20} className="text-blue-400" />
            Points Growth
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(20, 20, 20, 0.8)', 
                    backdropFilter: 'blur(12px)',
                    borderRadius: '16px', 
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#fff'
                  }}
                  itemStyle={{ color: '#fff' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="points" 
                  stroke="#ec4899" 
                  strokeWidth={4} 
                  dot={{ r: 6, fill: '#ec4899', strokeWidth: 2, stroke: '#141414' }}
                  activeDot={{ r: 8, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Member Contributions */}
      <div className="glass-card overflow-hidden border border-white/10 bg-white/5 backdrop-blur-3xl">
        <div className="p-6 border-b border-white/10">
          <h3 className="font-bold text-white">Member Contributions</h3>
        </div>
        <div className="p-6 space-y-6">
          {memberContributions.map((member, i) => (
            <div 
              key={i} 
              className="space-y-2 cursor-pointer group"
              onClick={() => setSelectedUser(member)}
            >
              <div className="flex items-center justify-between text-sm font-bold">
                <div className="flex items-center gap-2">
                  <span className="text-white/80 group-hover:text-pink-400 transition-colors">
                    {member.fullName || member.displayName}
                  </span>
                  {member.rollNumber && (
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-white/5 text-white/40 rounded text-[10px] font-mono border border-white/10">
                      <Hash size={10} />
                      {member.rollNumber}
                    </span>
                  )}
                  {member.role && (
                    <span className="px-2 py-0.5 bg-pink-500/10 text-pink-400 rounded text-[10px] uppercase tracking-wider border border-pink-500/20">
                      {member.role}
                    </span>
                  )}
                </div>
                <span className="text-pink-400">{formatPoints(member.points)} activity pts</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/10">
                <div 
                  className="h-full bg-pink-500 rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(236,72,153,0.4)]"
                  style={{ width: `${(member.points / (totalTeamActivityPoints || 1)) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedUser && (
        <UserProfileCard 
          user={selectedUser} 
          onClose={() => setSelectedUser(null)} 
        />
      )}
    </div>
  );
}
