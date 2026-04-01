import React from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, query, where, onSnapshot, doc, getDoc, setDoc, updateDoc, increment, orderBy } from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserProfile, Task, Team, UserRole, TeamProject } from './types';
import Auth from './components/Auth';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import TaskManager from './components/TaskManager';
import Leaderboard from './components/Leaderboard';
import TeamProjects from './components/TeamProjects';
import TeamChat from './components/TeamChat';
import ActivityPointsDetail from './components/ActivityPointsDetail';
import TasksCompletedDetail from './components/TasksCompletedDetail';
import ActivityRankDetail from './components/ActivityRankDetail';
import TeamMembersDetail from './components/TeamMembersDetail';
import ErrorBoundary from './components/ErrorBoundary';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export default function App() {
  const [user, setUser] = React.useState<User | null>(null);
  const [userProfile, setUserProfile] = React.useState<UserProfile | null>(null);
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [allTeamTasks, setAllTeamTasks] = React.useState<Task[]>([]);
  const [teamMembers, setTeamMembers] = React.useState<UserProfile[]>([]);
  const [team, setTeam] = React.useState<Team | null>(null);
  const [projects, setProjects] = React.useState<TeamProject[]>([]);
  const [activeTab, setActiveTab] = React.useState<'dashboard' | 'tasks' | 'leaderboard' | 'team-projects' | 'chat' | 'activity-points' | 'tasks-completed' | 'activity-rank' | 'team-members'>('dashboard');
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Check if user profile exists
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
          // Create default profile
          const defaultTeamId = 'general-team';
          const rollNumber = null; // Force user to set a valid roll number
          
          const newProfile: UserProfile = {
            uid: currentUser.uid,
            displayName: currentUser.displayName || 'Anonymous',
            fullName: currentUser.displayName || '',
            rollNumber: rollNumber,
            role: 'Member',
            email: currentUser.email || '',
            photoURL: currentUser.photoURL || '',
            activityPoints: 0,
            primarySkills: [],
            secondarySkills: [],
            teamId: defaultTeamId,
            streak: 0,
            lastActive: new Date().toISOString(),
            joinDate: new Date().toISOString(),
            completedTasksCount: 0
          };
          await setDoc(userDocRef, newProfile);
          
          // Ensure team exists
          const teamRef = doc(db, 'teams', defaultTeamId);
          const teamDoc = await getDoc(teamRef);
          if (!teamDoc.exists()) {
            await setDoc(teamRef, {
              id: defaultTeamId,
              name: 'General Team',
              memberCount: 1
            });
          } else {
            // Update member count
            await updateDoc(teamRef, {
              memberCount: increment(1)
            });
          }
        } else {
          // Check if existing user is missing new fields
          const data = userDoc.data() as UserProfile;
          if (!data.rollNumber || !data.fullName || !data.role || data.activityPoints === undefined || !data.teamId || !data.primarySkills || !data.secondarySkills) {
            const rollNumber = data.rollNumber || null;
            await updateDoc(userDocRef, {
              rollNumber: rollNumber,
              fullName: data.fullName || data.displayName || '',
              role: data.role || 'Member',
              activityPoints: data.activityPoints || 0,
              primarySkills: data.primarySkills || [],
              secondarySkills: data.secondarySkills || [],
              teamId: data.teamId || 'general-team',
              joinDate: data.joinDate || new Date().toISOString(),
              completedTasksCount: data.completedTasksCount || 0
            });
          }
        }
      } else {
        setUserProfile(null);
        setTasks([]);
        setAllTeamTasks([]);
        setTeamMembers([]);
        setTeam(null);
        setProjects([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Listen to user profile
  React.useEffect(() => {
    if (!user) return;
    const path = `users/${user.uid}`;
    const unsub = onSnapshot(doc(db, 'users', user.uid), (doc) => {
      if (doc.exists()) {
        setUserProfile(doc.data() as UserProfile);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
    return () => unsub();
  }, [user]);

  // Listen to tasks - Now fetching all tasks for the team
  React.useEffect(() => {
    if (!userProfile?.teamId) return;
    const path = 'tasks';
    const q = query(collection(db, 'tasks'), where('teamId', '==', userProfile.teamId));
    const unsub = onSnapshot(q, (snapshot) => {
      setTasks(snapshot.docs.map(doc => doc.data() as Task));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
    return () => unsub();
  }, [userProfile?.teamId]);

  // Listen to team data
  React.useEffect(() => {
    if (!userProfile?.teamId) return;
    
    // Team metadata
    const teamPath = `teams/${userProfile.teamId}`;
    const unsubTeam = onSnapshot(doc(db, 'teams', userProfile.teamId), (doc) => {
      if (doc.exists()) setTeam(doc.data() as Team);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, teamPath);
    });

    // Team members
    const membersPath = 'users';
    const qMembers = query(collection(db, 'users'), where('teamId', '==', userProfile.teamId));
    const unsubMembers = onSnapshot(qMembers, (snapshot) => {
      setTeamMembers(snapshot.docs.map(doc => doc.data() as UserProfile));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, membersPath);
    });

    // All team tasks (redundant with tasks above, but kept for detail views if needed)
    const tasksPath = 'tasks';
    const qTasks = query(collection(db, 'tasks'), where('teamId', '==', userProfile.teamId));
    const unsubTasks = onSnapshot(qTasks, (snapshot) => {
      setAllTeamTasks(snapshot.docs.map(doc => doc.data() as Task));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, tasksPath);
    });

    // Team projects
    const projectsPath = 'teamProjects';
    const qProjects = query(collection(db, 'teamProjects'), where('teamId', '==', userProfile.teamId));
    const unsubProjects = onSnapshot(qProjects, (snapshot) => {
      setProjects(snapshot.docs.map(doc => doc.data() as TeamProject));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, projectsPath);
    });

    return () => {
      unsubTeam();
      unsubMembers();
      unsubTasks();
      unsubProjects();
    };
  }, [userProfile?.teamId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] relative overflow-hidden">
        {/* Background Blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-pink-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] animate-pulse delay-700" />
        
        <div className="flex flex-col items-center gap-6 relative z-10">
          <div className="w-16 h-16 border-4 border-white/10 border-t-pink-500 rounded-full animate-spin shadow-2xl shadow-pink-500/20" />
          <div className="text-center">
            <p className="text-white font-black text-xl tracking-tight animate-pulse">Team Tracker</p>
            <p className="text-white/40 text-sm font-bold uppercase tracking-widest mt-2">Initializing Workspace...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  const handleUpdateRole = async (uid: string, role: UserRole) => {
    if (!userProfile?.teamId || userProfile.role !== 'Captain') return;
    try {
      await updateDoc(doc(db, 'users', uid), { role });
    } catch (error) {
      console.error("Error updating role:", error);
      alert("Failed to update role. Please try again.");
    }
  };

  const renderContent = () => {
    const rank = [...teamMembers]
      .sort((a, b) => (b.activityPoints || 0) - (a.activityPoints || 0))
      .findIndex(m => m.uid === user.uid) + 1;

    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard 
            userProfile={userProfile} 
            tasks={tasks} 
            rank={rank} 
            teamMembers={teamMembers} 
            team={team} 
            allTasks={allTeamTasks}
            projects={projects}
            onNavigate={(tab) => setActiveTab(tab as any)}
          />
        );
      case 'tasks':
        return <TaskManager tasks={tasks} userId={user.uid} teamId={userProfile?.teamId || 'general-team'} teamMembers={teamMembers} />;
      case 'leaderboard':
        return <Leaderboard users={teamMembers} currentUserId={user.uid} />;
      case 'team-projects':
        return <TeamProjects projects={projects} currentUser={userProfile} onBack={() => setActiveTab('dashboard')} />;
      case 'chat':
        return userProfile ? <TeamChat userProfile={userProfile} /> : null;
      case 'activity-points':
        return (
          <ActivityPointsDetail 
            teamMembers={teamMembers} 
            allTasks={allTeamTasks} 
            onBack={() => setActiveTab('dashboard')} 
          />
        );
      case 'tasks-completed':
        return (
          <TasksCompletedDetail 
            teamMembers={teamMembers} 
            allTasks={allTeamTasks} 
            onBack={() => setActiveTab('dashboard')} 
          />
        );
      case 'activity-rank':
        return (
          <ActivityRankDetail 
            teamMembers={teamMembers} 
            currentUser={userProfile} 
            onBack={() => setActiveTab('dashboard')} 
          />
        );
      case 'team-members':
        return (
          <TeamMembersDetail 
            teamMembers={teamMembers} 
            currentUser={userProfile} 
            onBack={() => setActiveTab('dashboard')}
            onUpdateRole={handleUpdateRole}
          />
        );
      default:
        return (
          <Dashboard 
            userProfile={userProfile} 
            tasks={tasks} 
            rank={rank} 
            teamMembers={teamMembers} 
            team={team} 
            allTasks={allTeamTasks}
            projects={projects}
            onNavigate={(tab) => setActiveTab(tab as any)} 
          />
        );
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} user={user} userProfile={userProfile}>
      {renderContent()}
    </Layout>
  );
}
