import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogOut, LayoutDashboard, ListTodo, Trophy, Users, Menu, X, MessageSquare, FolderOpen } from 'lucide-react';
import { auth } from '../firebase';
import { cn } from '../utils';

import { UserProfile } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: any) => void;
  user: any;
  userProfile: UserProfile | null;
}

export default function Layout({ children, activeTab, setActiveTab, user, userProfile }: LayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const detailPages = ['activity-points', 'tasks-completed', 'activity-rank', 'team-members', 'team-projects'];
  const effectiveTab = detailPages.includes(activeTab) ? 'dashboard' : activeTab;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tasks', label: 'Tasks', icon: ListTodo },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
    { id: 'team-projects', label: 'Team Projects', icon: FolderOpen },
    { id: 'chat', label: 'Team Chat', icon: MessageSquare },
  ];

  const handleLogout = () => {
    auth.signOut();
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row text-white">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-72 glass-sidebar flex-col text-white shadow-2xl z-50">
        <div className="p-8">
          <h1 className="text-2xl font-black tracking-tighter flex items-center gap-3 text-white italic">
            <div className="p-2.5 bg-white/20 rounded-2xl shadow-xl backdrop-blur-md border border-white/20">
              <Trophy className="text-white" size={24} />
            </div>
            Team Tracker
          </h1>
        </div>
        
        <nav className="flex-1 px-4 py-2 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-bold transition-all duration-300 group relative overflow-hidden",
                effectiveTab === item.id 
                  ? "bg-indigo-500/20 text-white shadow-xl border border-indigo-500/30 backdrop-blur-md" 
                  : "text-white/60 hover:bg-white/10 hover:text-white"
              )}
            >
              {effectiveTab === item.id && (
                <motion.div 
                  layoutId="active-pill"
                  className="absolute left-0 w-1.5 h-6 bg-white rounded-r-full"
                />
              )}
              <item.icon size={22} className={cn("transition-transform duration-300 group-hover:scale-110", effectiveTab === item.id ? "text-white" : "text-white/60")} />
              <span className="tracking-wide">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-6">
          <div className="flex items-center gap-4 p-4 mb-4 bg-indigo-500/10 rounded-3xl border border-indigo-500/20 backdrop-blur-md hover:bg-indigo-500/20 transition-all cursor-pointer group">
            <div className="relative">
              <img 
                src={user?.photoURL || `https://picsum.photos/seed/${user?.uid}/48/48`} 
                alt={user?.displayName} 
                className="w-12 h-12 rounded-2xl border-2 border-white/30 shadow-lg group-hover:scale-105 transition-transform"
                referrerPolicy="no-referrer"
              />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-[#312e81] rounded-full" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate text-white">{userProfile?.fullName || user?.displayName}</p>
              <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest truncate">
                {userProfile?.role || 'Member'}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-3 px-4 py-4 rounded-2xl text-sm font-bold text-white/60 hover:text-white hover:bg-white/10 transition-all duration-300 border border-transparent hover:border-white/10"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden glass-sidebar p-4 flex items-center justify-between sticky top-0 z-50 text-white">
        <h1 className="text-lg font-bold flex items-center gap-2 text-white">
          <Trophy className="text-white" size={24} />
          Team Tracker
        </h1>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-white/80 hover:bg-white/10 rounded-lg"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-40" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Mobile Menu Drawer */}
      <div className={cn(
        "md:hidden fixed top-[65px] left-0 right-0 glass-sidebar z-50 transition-all duration-300 transform origin-top text-white",
        isMobileMenuOpen ? "scale-y-100 opacity-100" : "scale-y-0 opacity-0 pointer-events-none"
      )}>
        <nav className="p-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setIsMobileMenuOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                effectiveTab === item.id 
                  ? "bg-white/20 text-white" 
                  : "text-white/70 hover:bg-white/10"
              )}
            >
              <item.icon size={20} className={effectiveTab === item.id ? "text-white" : ""} />
              {item.label}
            </button>
          ))}
          <div className="pt-4 border-t border-white/10 mt-4">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white hover:bg-white/10 transition-all duration-200"
            >
              <LogOut size={20} />
              Logout
            </button>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-10 lg:p-16 bg-white/5">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
