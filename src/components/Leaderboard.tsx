import React from 'react';
import { 
  Trophy, 
  Medal, 
  TrendingUp, 
  Search,
  ChevronRight,
  User,
  Crown,
  Star,
  Hash
} from 'lucide-react';
import { UserProfile } from '../types';
import { formatPoints, cn } from '../utils';
import UserProfileCard from './UserProfileCard';

interface LeaderboardProps {
  users: UserProfile[];
  currentUserId: string;
}

export default function Leaderboard({ users, currentUserId }: LeaderboardProps) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedUser, setSelectedUser] = React.useState<UserProfile | null>(null);
  
  const sortedUsers = [...users].sort((a, b) => (b.activityPoints || 0) - (a.activityPoints || 0));
  const filteredUsers = sortedUsers.filter(u => 
    u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.rollNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const topThree = sortedUsers.slice(0, 3);

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white">Leaderboard</h2>
          <p className="text-white/60 mt-1 font-medium">Ranked by activity points earned.</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
          <input 
            type="text" 
            placeholder="Search by name or roll no..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="glass-input w-full pl-11 pr-4 py-2.5 text-sm text-white placeholder:text-white/20 bg-white/5 border-white/10"
          />
        </div>
      </header>

      {/* Podium */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-8">
        {/* 2nd Place */}
        {topThree[1] && (
          <div 
            onClick={() => setSelectedUser(topThree[1])}
            className="order-2 md:order-1 glass-card p-6 text-center relative h-[220px] flex flex-col justify-end group hover:border-indigo-500/30 transition-all cursor-pointer shadow-sm border border-white/10 bg-white/5 backdrop-blur-3xl"
          >
            <div className="absolute -top-10 left-1/2 -translate-x-1/2">
              <div className="relative">
                <img 
                  src={topThree[1].photoURL || `https://picsum.photos/seed/${topThree[1].uid}/80/80`} 
                  alt={topThree[1].displayName}
                  className="w-20 h-20 rounded-full border-4 border-white/20 shadow-lg object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute -bottom-2 -right-2 bg-indigo-500/20 text-indigo-400 w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 border-white/20 shadow-sm backdrop-blur-md">2</div>
              </div>
            </div>
            <h4 className="font-bold text-white truncate">{topThree[1].displayName}</h4>
            <p className="text-sm text-white/40 mt-1 font-bold">{formatPoints(topThree[1].activityPoints || 0)} pts</p>
            <div className="mt-4 h-2 bg-white/5 rounded-full overflow-hidden border border-white/10">
              <div className="h-full bg-indigo-400 w-3/4 shadow-[0_0_10px_rgba(129,140,248,0.4)]" />
            </div>
          </div>
        )}

        {/* 1st Place */}
        {topThree[0] && (
          <div 
            onClick={() => setSelectedUser(topThree[0])}
            className="order-1 md:order-2 glass-card p-8 border-indigo-500/30 text-center relative h-[260px] flex flex-col justify-end group hover:border-indigo-500/50 transition-all cursor-pointer shadow-xl bg-white/10 backdrop-blur-3xl"
          >
            <div className="absolute -top-14 left-1/2 -translate-x-1/2">
              <div className="relative">
                <Crown className="absolute -top-8 left-1/2 -translate-x-1/2 text-indigo-400 animate-bounce" size={32} />
                <img 
                  src={topThree[0].photoURL || `https://picsum.photos/seed/${topThree[0].uid}/100/100`} 
                  alt={topThree[0].displayName}
                  className="w-24 h-24 rounded-full border-4 border-white/20 shadow-2xl object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute -bottom-2 -right-2 bg-indigo-500 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold border-4 border-white/20 shadow-lg backdrop-blur-md">1</div>
              </div>
            </div>
            <h4 className="text-xl font-bold text-white truncate">{topThree[0].displayName}</h4>
            <p className="text-indigo-400 font-bold mt-1 text-lg">{formatPoints(topThree[0].activityPoints || 0)} pts</p>
            <div className="mt-6 h-3 bg-white/5 rounded-full overflow-hidden border border-white/10">
              <div className="h-full bg-indigo-600 w-full shadow-[0_0_15px_rgba(79,70,229,0.6)]" />
            </div>
          </div>
        )}

        {/* 3rd Place */}
        {topThree[2] && (
          <div 
            onClick={() => setSelectedUser(topThree[2])}
            className="order-3 md:order-3 glass-card p-6 text-center relative h-[200px] flex flex-col justify-end group hover:border-indigo-500/30 transition-all cursor-pointer shadow-sm border border-white/10 bg-white/5 backdrop-blur-3xl"
          >
            <div className="absolute -top-10 left-1/2 -translate-x-1/2">
              <div className="relative">
                <img 
                  src={topThree[2].photoURL || `https://picsum.photos/seed/${topThree[2].uid}/80/80`} 
                  alt={topThree[2].displayName}
                  className="w-20 h-20 rounded-full border-4 border-white/20 shadow-lg object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute -bottom-2 -right-2 bg-pink-500/20 text-pink-400 w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 border-white/20 shadow-sm backdrop-blur-md">3</div>
              </div>
            </div>
            <h4 className="font-bold text-white truncate">{topThree[2].displayName}</h4>
            <p className="text-sm text-white/40 mt-1 font-bold">{formatPoints(topThree[2].activityPoints || 0)} pts</p>
            <div className="mt-4 h-2 bg-white/5 rounded-full overflow-hidden border border-white/10">
              <div className="h-full bg-pink-400 w-1/2 shadow-[0_0_10px_rgba(244,114,182,0.4)]" />
            </div>
          </div>
        )}
      </div>

      {/* List */}
      <div className="glass-card overflow-hidden shadow-sm border border-white/10 bg-white/5 backdrop-blur-3xl">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <h3 className="font-bold text-white">All Members</h3>
          <span className="text-xs font-bold text-white/40 uppercase tracking-wider">{filteredUsers.length} Members</span>
        </div>
        <div className="divide-y divide-white/10">
          {filteredUsers.map((user, index) => (
            <div 
              key={user.uid} 
              onClick={() => setSelectedUser(user)}
              className={cn(
                "flex items-center gap-4 p-4 hover:bg-white/5 transition-colors group cursor-pointer",
                user.uid === currentUserId ? "bg-indigo-500/10" : ""
              )}
            >
              <div className="w-8 text-center font-bold text-white/20 group-hover:text-indigo-400 transition-colors">
                {index + 1}
              </div>
              <img 
                src={user.photoURL || `https://picsum.photos/seed/${user.uid}/40/40`} 
                alt={user.displayName} 
                className="w-10 h-10 rounded-full border border-white/10 object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-white truncate">{user.fullName || user.displayName}</p>
                  {user.uid === currentUserId && (
                    <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded-full uppercase border border-indigo-500/20">You</span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-white/40 font-medium">
                  <span className="truncate">{user.email}</span>
                  {user.rollNumber && (
                    <span className="flex items-center gap-0.5 font-bold text-white/20">
                      <Hash size={10} />
                      {user.rollNumber}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-white">{formatPoints(user.activityPoints || 0)}</p>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-tighter">Activity Pts</p>
              </div>
              <ChevronRight className="text-white/10 group-hover:text-indigo-400 transition-colors" size={20} />
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
