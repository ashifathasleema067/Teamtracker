import React from 'react';
import { 
  X, 
  Mail, 
  Calendar, 
  Trophy, 
  Hash, 
  User as UserIcon, 
  Shield, 
  CheckCircle2, 
  Zap,
  Users,
  Code,
  Cpu
} from 'lucide-react';
import { UserProfile, UserRole } from '../types';
import { formatPoints } from '../utils';

interface UserProfileCardProps {
  user: UserProfile;
  teamName?: string;
  onClose: () => void;
}

export default function UserProfileCard({ user, teamName, onClose }: UserProfileCardProps) {
  const roleColors: Record<UserRole, string> = {
    'Captain': 'bg-indigo-600/20 text-indigo-400 border-indigo-500/30 shadow-lg shadow-indigo-500/20 backdrop-blur-md',
    'Vice Captain': 'bg-orange-600/20 text-orange-400 border-orange-500/30 shadow-lg shadow-orange-500/20 backdrop-blur-md',
    'Manager': 'bg-blue-600/20 text-blue-400 border-blue-500/30 shadow-lg shadow-blue-500/20 backdrop-blur-md',
    'Strategist': 'bg-purple-600/20 text-purple-400 border-purple-500/30 shadow-lg shadow-purple-500/20 backdrop-blur-md',
    'Member': 'bg-white/5 text-white/60 border-white/10 backdrop-blur-md',
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="glass-card w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300 border border-white/10 bg-white/5 backdrop-blur-3xl">
        {/* Header/Cover */}
        <div className="h-32 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-all shadow-sm border border-white/10"
          >
            <X size={20} />
          </button>
        </div>

        {/* Profile Info */}
        <div className="px-8 pb-8 -mt-16 relative">
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              <img 
                src={user.photoURL || `https://picsum.photos/seed/${user.uid}/128/128`} 
                alt={user.displayName} 
                className="w-32 h-32 rounded-full border-4 border-white/20 shadow-xl object-cover bg-white/5"
                referrerPolicy="no-referrer"
              />
              {user.role === 'Captain' && (
                <div className="absolute -bottom-1 -right-1 bg-indigo-600 text-white p-2 rounded-full shadow-lg border-2 border-white/20">
                  <Shield size={20} />
                </div>
              )}
            </div>

            <div className="mt-4">
              <h2 className="text-2xl font-bold text-white">{user.fullName || user.displayName}</h2>
              <p className="text-white/40 flex items-center justify-center gap-1 font-medium">
                <Mail size={14} />
                {user.email}
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {user.role && (
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${roleColors[user.role]}`}>
                  {user.role}
                </span>
              )}
              {user.rollNumber && (
                <span className="px-3 py-1 rounded-full text-xs font-bold border border-white/10 bg-white/5 text-white/60 flex items-center gap-1 backdrop-blur-md">
                  <Hash size={12} />
                  {user.rollNumber}
                </span>
              )}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mt-8">
            <div className="bg-white/5 p-4 rounded-2xl border border-white/10 shadow-sm backdrop-blur-md">
              <div className="flex items-center gap-2 text-white/40 text-[10px] font-bold uppercase tracking-wider mb-1">
                <CheckCircle2 size={14} className="text-emerald-400" />
                Tasks Done
              </div>
              <p className="text-xl font-bold text-white">{user.completedTasksCount || 0}</p>
            </div>
            <div className="bg-white/5 p-4 rounded-2xl border border-white/10 shadow-sm backdrop-blur-md">
              <div className="flex items-center gap-2 text-white/40 text-[10px] font-bold uppercase tracking-wider mb-1">
                <Zap size={14} className="text-amber-400" />
                Current Streak
              </div>
              <p className="text-xl font-bold text-white">{user.streak} Days</p>
            </div>
            <div className="bg-white/5 p-4 rounded-2xl border border-white/10 shadow-sm backdrop-blur-md">
              <div className="flex items-center gap-2 text-white/40 text-[10px] font-bold uppercase tracking-wider mb-1">
                <Activity size={14} className="text-indigo-400" />
                Activity Points
              </div>
              <p className="text-xl font-bold text-white">{user.activityPoints || 0}</p>
            </div>
            <div className="bg-white/5 p-4 rounded-2xl border border-white/10 shadow-sm backdrop-blur-md">
              <div className="flex items-center gap-2 text-white/40 text-[10px] font-bold uppercase tracking-wider mb-1">
                <Users size={14} className="text-purple-400" />
                Team
              </div>
              <p className="text-xl font-bold text-white truncate">{teamName || 'General'}</p>
            </div>
          </div>

          {/* Skills Section */}
          {(user.primarySkills?.length || 0) > 0 && (
            <div className="mt-8">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Code size={16} className="text-indigo-400" />
                Primary Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {user.primarySkills?.map((skill, i) => (
                  <span key={i} className="px-3 py-1 bg-indigo-500/20 text-indigo-400 rounded-xl text-xs font-bold border border-indigo-500/20 backdrop-blur-md">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {(user.secondarySkills?.length || 0) > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Cpu size={16} className="text-purple-400" />
                Secondary Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {user.secondarySkills?.map((skill, i) => (
                  <span key={i} className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-xl text-xs font-bold border border-purple-500/20 backdrop-blur-md">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Footer Info */}
          <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between text-sm text-white/40 font-medium">
            <div className="flex items-center gap-1">
              <Calendar size={14} />
              Joined {user.joinDate ? new Date(user.joinDate).toLocaleDateString() : 'Recently'}
            </div>
            <div className="flex items-center gap-1">
              <Activity size={14} />
              Active {new Date(user.lastActive).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Activity({ size, className }: { size: number, className?: string }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}
