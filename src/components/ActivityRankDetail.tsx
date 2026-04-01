import React from 'react';
import { UserProfile, UserRole } from '../types';
import { Trophy, Medal, ArrowLeft, Star, TrendingUp, User } from 'lucide-react';
import { cn, formatPoints } from '../utils';
import { motion } from 'motion/react';

interface ActivityRankDetailProps {
  teamMembers: UserProfile[];
  currentUser: UserProfile | null;
  onBack: () => void;
}

export default function ActivityRankDetail({ teamMembers, currentUser, onBack }: ActivityRankDetailProps) {
  const sortedMembers = [...teamMembers].sort((a, b) => (b.activityPoints || 0) - (a.activityPoints || 0));
  const topThree = sortedMembers.slice(0, 3);
  const others = sortedMembers.slice(3);
  const userRank = sortedMembers.findIndex(m => m.uid === currentUser?.uid) + 1;

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex items-center gap-6">
        <button 
          onClick={onBack}
          className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all text-white shadow-sm border border-white/10 backdrop-blur-md"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h2 className="text-4xl font-black text-white tracking-tight">Activity Rank</h2>
          <p className="text-white/60 font-medium mt-1 text-lg">Celebrate the top performers in your team.</p>
        </div>
      </header>

      {/* Podium Section */}
      <div className="flex flex-col md:flex-row items-end justify-center gap-8 md:gap-6 px-4 pt-16 pb-8">
        {/* Second Place */}
        {topThree[1] && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center order-2 md:order-1 w-full md:w-56"
          >
            <div className="relative mb-6">
              <img 
                src={topThree[1].photoURL || `https://picsum.photos/seed/${topThree[1].uid}/120/120`} 
                alt={topThree[1].displayName}
                className="w-28 h-28 rounded-3xl border-4 border-indigo-200 shadow-xl object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute -bottom-3 -right-3 w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center border-4 border-white text-white font-black text-lg shadow-lg">
                2
              </div>
            </div>
            <div className="glass-card p-6 rounded-t-[2.5rem] border-b-0 w-full text-center h-40 flex flex-col justify-center shadow-2xl border border-white/10 bg-white/5 backdrop-blur-3xl">
              <p className="font-black text-white truncate text-lg">{topThree[1].fullName || topThree[1].displayName}</p>
              <p className="text-indigo-400 font-black text-2xl mt-2">{formatPoints(topThree[1].activityPoints || 0)}</p>
            </div>
          </motion.div>
        )}

        {/* First Place */}
        {topThree[0] && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center order-1 md:order-2 w-full md:w-64 z-10"
          >
            <div className="relative mb-8">
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 text-amber-500 animate-bounce">
                <Trophy size={48} fill="currentColor" />
              </div>
              <img 
                src={topThree[0].photoURL || `https://picsum.photos/seed/${topThree[0].uid}/140/140`} 
                alt={topThree[0].displayName}
                className="w-36 h-36 rounded-[2.5rem] border-4 border-amber-400 shadow-2xl shadow-amber-500/20 object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center border-4 border-white text-white font-black text-2xl shadow-xl">
                1
              </div>
            </div>
            <div className="glass-card p-8 rounded-t-[3rem] border-b-0 w-full text-center h-56 flex flex-col justify-center shadow-2xl border border-white/10 bg-white/5 backdrop-blur-3xl ring-8 ring-amber-500/5">
              <p className="font-black text-white text-xl truncate">{topThree[0].fullName || topThree[0].displayName}</p>
              <p className="text-amber-400 font-black text-4xl mt-3">{formatPoints(topThree[0].activityPoints || 0)}</p>
              <div className="flex items-center justify-center gap-2 mt-4 text-amber-500">
                <Star size={20} fill="currentColor" />
                <Star size={20} fill="currentColor" />
                <Star size={20} fill="currentColor" />
              </div>
            </div>
          </motion.div>
        )}

        {/* Third Place */}
        {topThree[2] && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col items-center order-3 md:order-3 w-full md:w-56"
          >
            <div className="relative mb-6">
              <img 
                src={topThree[2].photoURL || `https://picsum.photos/seed/${topThree[2].uid}/120/120`} 
                alt={topThree[2].displayName}
                className="w-28 h-28 rounded-3xl border-4 border-purple-200 shadow-xl object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute -bottom-3 -right-3 w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center border-4 border-white text-white font-black text-lg shadow-lg">
                3
              </div>
            </div>
            <div className="glass-card p-6 rounded-t-[2.5rem] border-b-0 w-full text-center h-32 flex flex-col justify-center shadow-2xl border border-white/10 bg-white/5 backdrop-blur-3xl">
              <p className="font-black text-white truncate text-lg">{topThree[2].fullName || topThree[2].displayName}</p>
              <p className="text-purple-400 font-black text-2xl mt-2">{formatPoints(topThree[2].activityPoints || 0)}</p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Current User Rank Card */}
      {currentUser && (
        <div className="p-10 rounded-[3rem] bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden group">
          <div className="flex items-center gap-8 relative z-10">
            <div className="w-24 h-24 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center text-4xl font-black border-4 border-white/30 shadow-lg">
              #{userRank}
            </div>
            <div>
              <h3 className="text-3xl font-black tracking-tight">Your Current Rank</h3>
              <p className="text-white/80 mt-2 font-medium text-lg">Keep it up! You're in the top {Math.round((userRank / teamMembers.length) * 100)}% of your team.</p>
            </div>
          </div>
          <div className="flex items-center gap-12 relative z-10">
            <div className="text-center">
              <p className="text-white/60 text-xs uppercase font-black tracking-widest mb-2">Points</p>
              <p className="text-4xl font-black">{formatPoints(currentUser.activityPoints || 0)}</p>
            </div>
            <div className="w-px h-16 bg-white/20 hidden md:block" />
            <div className="text-center">
              <p className="text-white/60 text-xs uppercase font-black tracking-widest mb-2">Role</p>
              <p className="text-4xl font-black">{currentUser.role}</p>
            </div>
          </div>
          <TrendingUp className="absolute -bottom-10 -right-10 w-48 h-48 opacity-10 text-white group-hover:scale-110 transition-transform duration-700" />
        </div>
      )}

      {/* Rest of the Leaderboard */}
      <div className="glass-card overflow-hidden shadow-2xl border border-white/10 bg-white/5 backdrop-blur-3xl">
        <div className="p-8 border-b border-white/10 flex items-center justify-between">
          <h3 className="text-2xl font-black text-white">Leaderboard</h3>
          <div className="flex items-center gap-3 text-white/40 text-sm font-bold">
            <div className="p-2 bg-white/5 rounded-xl border border-white/10">
              <TrendingUp size={16} />
            </div>
            <span>Updated in real-time</span>
          </div>
        </div>
        <div className="divide-y divide-white/10">
          {others.map((member, index) => (
            <div 
              key={member.uid} 
              className={cn(
                "flex items-center justify-between p-8 hover:bg-white/5 transition-colors group",
                member.uid === currentUser?.uid && "bg-indigo-500/10"
              )}
            >
              <div className="flex items-center gap-8">
                <span className="w-10 text-center font-black text-white/20 text-lg">#{index + 4}</span>
                <div className="flex items-center gap-5">
                  <img 
                    src={member.photoURL || `https://picsum.photos/seed/${member.uid}/120/120`} 
                    alt={member.displayName}
                    className="w-14 h-14 rounded-2xl border-2 border-white/20 shadow-md object-cover group-hover:scale-105 transition-transform"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <p className="font-black text-white text-lg">{member.fullName || member.displayName}</p>
                    <p className="text-xs text-white/40 font-bold uppercase tracking-widest mt-1">{member.role}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-12">
                <div className="text-right hidden sm:block">
                  <p className="text-[10px] text-white/40 uppercase font-black tracking-widest mb-1">Roll Number</p>
                  <p className="font-bold text-white/60">{member.rollNumber || 'N/A'}</p>
                </div>
                <div className="text-right min-w-[120px]">
                  <p className="text-[10px] text-white/40 uppercase font-black tracking-widest mb-1">Points</p>
                  <span className="px-4 py-2 bg-white/5 text-white rounded-xl font-black text-lg border border-white/10">
                    {formatPoints(member.activityPoints || 0)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
