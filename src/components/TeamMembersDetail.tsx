import React, { useState } from 'react';
import { UserProfile, UserRole } from '../types';
import { Users, Search, Filter, ArrowLeft, Mail, Phone, Shield, UserMinus, MoreVertical, Trash2, ShieldCheck } from 'lucide-react';
import { cn } from '../utils';
import { removeMemberFromTeam } from '../services/firestore';

interface TeamMembersDetailProps {
  teamMembers: UserProfile[];
  currentUser: UserProfile | null;
  onBack: () => void;
  onUpdateRole: (uid: string, role: UserRole) => Promise<void>;
}

export default function TeamMembersDetail({ teamMembers, currentUser, onBack, onUpdateRole }: TeamMembersDetailProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [isRemoving, setIsRemoving] = useState<string | null>(null);

  const isCaptain = currentUser?.role === 'Captain';

  const filteredMembers = teamMembers.filter(member => {
    const matchesSearch = (member.fullName || member.displayName).toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (member.rollNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (member.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleRemoveMember = async (member: UserProfile) => {
    if (!isCaptain || !currentUser?.teamId) return;
    if (!window.confirm(`Are you sure you want to remove ${member.fullName || member.displayName} from the team?`)) return;

    setIsRemoving(member.uid);
    try {
      await removeMemberFromTeam(member.uid, currentUser.teamId, member.role || 'Member');
    } catch (error) {
      console.error('Error removing member:', error);
      alert('Failed to remove member. Please try again.');
    } finally {
      setIsRemoving(null);
    }
  };

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
          <h2 className="text-4xl font-black text-white tracking-tight">Team Directory</h2>
          <p className="text-white/60 font-medium mt-1 text-lg">Manage and connect with your fellow team members.</p>
        </div>
      </header>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-blue-400 to-indigo-600 text-white shadow-xl relative overflow-hidden group">
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30">
                <Users size={24} />
              </div>
              <h3 className="font-bold text-white/90 uppercase tracking-widest text-sm">Total Members</h3>
            </div>
            <p className="text-5xl font-black">{teamMembers.length}</p>
          </div>
          <Users className="absolute -bottom-6 -right-6 w-32 h-32 opacity-10 text-white group-hover:scale-110 transition-transform duration-700" />
        </div>

        <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-purple-400 to-violet-600 text-white shadow-xl relative overflow-hidden group">
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30">
                <ShieldCheck size={24} />
              </div>
              <h3 className="font-bold text-white/90 uppercase tracking-widest text-sm">Leadership</h3>
            </div>
            <p className="text-5xl font-black">
              {teamMembers.filter(m => m.role === 'Captain' || m.role === 'Manager').length}
            </p>
          </div>
          <ShieldCheck className="absolute -bottom-6 -right-6 w-32 h-32 opacity-10 text-white group-hover:scale-110 transition-transform duration-700" />
        </div>

        <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-emerald-400 to-teal-600 text-white shadow-xl relative overflow-hidden group">
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30">
                <Shield size={24} />
              </div>
              <h3 className="font-bold text-white/90 uppercase tracking-widest text-sm">Active Members</h3>
            </div>
            <p className="text-5xl font-black">
              {teamMembers.filter(m => m.role === 'Member').length}
            </p>
          </div>
          <Shield className="absolute -bottom-6 -right-6 w-32 h-32 opacity-10 text-white group-hover:scale-110 transition-transform duration-700" />
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-8 flex flex-col md:flex-row gap-6 shadow-2xl border border-white/10 bg-white/5 backdrop-blur-3xl">
        <div className="relative flex-1">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/40" size={20} />
          <input 
            type="text"
            placeholder="Search by name, roll number, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="glass-input w-full pl-14 pr-6 py-4 text-lg bg-white/5 border-white/10 text-white placeholder:text-white/20"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-5 top-1/2 -translate-y-1/2 text-white/40" size={20} />
          <select 
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="glass-input pl-14 pr-12 py-4 appearance-none cursor-pointer min-w-[200px] text-lg font-bold bg-white/5 border-white/10 text-white"
          >
            <option value="all" className="bg-slate-900">All Roles</option>
            <option value="Captain" className="bg-slate-900">Captains</option>
            <option value="Manager" className="bg-slate-900">Managers</option>
            <option value="Member" className="bg-slate-900">Members</option>
          </select>
        </div>
      </div>

      {/* Member Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredMembers.length > 0 ? (
          filteredMembers.map((member) => (
            <div 
              key={member.uid} 
              className={cn(
                "glass-card p-8 hover:border-indigo-400/30 transition-all group relative shadow-xl hover:shadow-2xl",
                member.uid === currentUser?.uid && "ring-2 ring-indigo-500/20 bg-indigo-500/5"
              )}
            >
              <div className="flex items-start justify-between mb-8">
                <div className="relative">
                  <img 
                    src={member.photoURL || `https://picsum.photos/seed/${member.uid}/120/120`} 
                    alt={member.displayName}
                    className="w-24 h-24 rounded-3xl border-4 border-white/20 shadow-lg object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className={cn(
                    "absolute -bottom-3 -right-3 px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border-4 border-[#1e1b4b] shadow-xl",
                    member.role === 'Captain' ? "bg-indigo-600 text-white" :
                    member.role === 'Manager' ? "bg-purple-600 text-white" :
                    "bg-white/10 text-white/60 backdrop-blur-md"
                  )}>
                    {member.role}
                  </div>
                </div>
                
                {isCaptain && member.uid !== currentUser?.uid && (
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                    <button 
                      onClick={() => handleRemoveMember(member)}
                      disabled={isRemoving === member.uid}
                      className="p-3 text-rose-400 hover:bg-rose-500 hover:text-white rounded-2xl transition-colors shadow-sm bg-white/5 border border-white/10 backdrop-blur-md"
                      title="Remove from team"
                    >
                      {isRemoving === member.uid ? (
                        <div className="w-5 h-5 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 size={20} />
                      )}
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-2xl font-black text-white truncate">{member.fullName || member.displayName}</h4>
                  <p className="text-sm text-white/40 font-bold uppercase tracking-widest mt-1">{member.rollNumber || 'No Roll Number'}</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-4 text-white/60 text-sm font-medium">
                    <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-white/40 border border-white/10">
                      <Mail size={16} />
                    </div>
                    <span className="truncate">{member.email || 'No email provided'}</span>
                  </div>
                  <div className="flex items-center gap-4 text-white/60 text-sm font-medium">
                    <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-white/40 border border-white/10">
                      <Phone size={16} />
                    </div>
                    <span>{member.phoneNumber || 'No phone number'}</span>
                  </div>
                </div>

                {isCaptain && member.uid !== currentUser?.uid && (
                  <div className="pt-6 border-t border-white/10">
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-3">Change Role</p>
                    <div className="flex gap-3">
                      {['Manager', 'Member'].map((role) => (
                        <button
                          key={role}
                          onClick={() => onUpdateRole(member.uid, role as UserRole)}
                          className={cn(
                            "flex-1 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all",
                            member.role === role 
                              ? "bg-indigo-500/20 text-indigo-400 shadow-lg border-indigo-500/30" 
                              : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white border border-white/10"
                          )}
                        >
                          {role}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-24 text-center glass-card rounded-[3rem] border-2 border-dashed border-white/10 bg-white/5 backdrop-blur-3xl">
            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 text-white/20 border border-white/10">
              <Users size={48} />
            </div>
            <h3 className="text-2xl font-black text-white">No members found</h3>
            <p className="text-white/40 mt-2 font-medium">Try adjusting your search or filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
