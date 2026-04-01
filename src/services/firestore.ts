import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  increment,
  writeBatch,
  getDocs,
  addDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, auth, storage } from '../firebase';
import { UserProfile, Task, Team, TeamProject } from '../types';

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

export const getUserProfile = async (uid: string) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    return userDoc.exists() ? (userDoc.data() as UserProfile) : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `users/${uid}`);
  }
};

export const createUserProfile = async (user: UserProfile) => {
  try {
    await setDoc(doc(db, 'users', user.uid), user);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}`);
  }
};

export const updateUserProfile = async (uid: string, updates: Partial<UserProfile>) => {
  try {
    await updateDoc(doc(db, 'users', uid), updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
  }
};

export const updateUserProfileAndTeamRole = async (
  uid: string, 
  updates: Partial<UserProfile>, 
  _teamId: string,
  _oldRole: string,
  _newRole: string
) => {
  try {
    await updateDoc(doc(db, 'users', uid), updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
  }
};

export const removeMemberFromTeam = async (uid: string, teamId: string, role: string) => {
  try {
    const batch = writeBatch(db);
    const userRef = doc(db, 'users', uid);
    const teamRef = doc(db, 'teams', teamId);

    // Remove user from team
    batch.update(userRef, { 
      teamId: null, 
      role: 'Member',
      rollNumber: null 
    });

    // Decrement member count
    batch.update(teamRef, { 
      memberCount: increment(-1) 
    });

    // Clear role ID from team doc if it was a special role
    const getRoleField = (role: string) => {
      switch (role) {
        case 'Captain': return 'captainId';
        case 'Vice Captain': return 'viceCaptainId';
        case 'Manager': return 'managerId';
        case 'Strategist': return 'strategistId';
        default: return null;
      }
    };

    const roleField = getRoleField(role);
    if (roleField) {
      batch.update(teamRef, { [roleField]: null });
    }

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `batch-remove-member`);
  }
};

export const checkRollNumberUniqueness = async (teamId: string, rollNumber: string, currentUid: string) => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(
      usersRef, 
      where('teamId', '==', teamId), 
      where('rollNumber', '==', rollNumber)
    );
    const querySnapshot = await getDocs(q);
    
    // If no one has this roll number, it's unique
    if (querySnapshot.empty) return true;
    
    // If someone has it, check if it's the current user
    const otherUser = querySnapshot.docs.find(doc => doc.id !== currentUid);
    return !otherUser;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, `users-query-rollNumber`);
  }
};

export const updatePoints = async (uid: string, points: number, _teamId: string) => {
  try {
    await updateDoc(doc(db, 'users', uid), {
      activityPoints: increment(points)
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
  }
};

export const createTask = async (task: Task) => {
  await setDoc(doc(db, 'tasks', task.id), task);
};

export const updateTaskStatus = async (task: Task, status: 'pending' | 'completed', points: number = 0, uid: string, teamId: string) => {
  const batch = writeBatch(db);
  const taskRef = doc(db, 'tasks', task.id);
  const now = new Date().toISOString();
  
  if (status === 'completed') {
    batch.update(taskRef, {
      status,
      completedAt: now,
      earnedPoints: points
    });
    
    batch.update(doc(db, 'users', uid), {
      activityPoints: increment(points),
      completedTasksCount: increment(1)
    });
  } else {
    // Toggling back to pending
    const pointsToSubtract = task.earnedPoints || 0;
    
    batch.update(taskRef, {
      status,
      completedAt: null,
      earnedPoints: 0
    });
    
    batch.update(doc(db, 'users', uid), {
      activityPoints: increment(-pointsToSubtract),
      completedTasksCount: increment(-1)
    });
  }
  
  await batch.commit();
};

export const updateTask = async (taskId: string, updates: Partial<Task>) => {
  await updateDoc(doc(db, 'tasks', taskId), updates);
};

export const deleteTask = async (taskId: string) => {
  await deleteDoc(doc(db, 'tasks', taskId));
};

export const submitTask = async (
  taskId: string, 
  userId: string, 
  userName: string, 
  userPhoto: string | undefined,
  files: File[], 
  comment: string
) => {
  try {
    const uploadedFiles = await Promise.all(
      files.map(async (file) => {
        try {
          const fileRef = ref(storage, `tasks/${taskId}/submissions/${userId}/${Date.now()}_${file.name}`);
          console.log(`Uploading file: ${file.name} to ${fileRef.fullPath}`);
          const snapshot = await uploadBytes(fileRef, file);
          const url = await getDownloadURL(snapshot.ref);
          console.log(`File uploaded successfully: ${file.name}, URL: ${url}`);
          return { name: file.name, url, type: file.type };
        } catch (uploadError) {
          console.error(`Error uploading file ${file.name}:`, uploadError);
          throw uploadError;
        }
      })
    );

    const submission = {
      userId,
      userName,
      userPhoto: userPhoto || '',
      files: uploadedFiles,
      timestamp: new Date().toISOString(),
      comment
    };

    const taskRef = doc(db, 'tasks', taskId);
    const taskDoc = await getDoc(taskRef);
    if (!taskDoc.exists()) throw new Error('Task not found');
    
    const taskData = taskDoc.data() as Task;
    const existingSubmissions = taskData.submissions || [];
    
    await updateDoc(taskRef, {
      submissions: [...existingSubmissions, submission]
    });

    return submission;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `tasks/${taskId}/submit`);
  }
};

export const getTeam = async (teamId: string) => {
  const teamDoc = await getDoc(doc(db, 'teams', teamId));
  return teamDoc.exists() ? (teamDoc.data() as Team) : null;
};

export const createTeam = async (team: Team) => {
  await setDoc(doc(db, 'teams', team.id), team);
};

export const updateTeam = async (teamId: string, updates: Partial<Team>) => {
  await updateDoc(doc(db, 'teams', teamId), updates);
};

export const getAllTeams = async () => {
  const teamsSnapshot = await getDocs(collection(db, 'teams'));
  return teamsSnapshot.docs.map(doc => doc.data() as Team);
};

export const clearTeamChat = async (teamId: string) => {
  try {
    const messagesRef = collection(db, 'teams', teamId, 'messages');
    const snapshot = await getDocs(messagesRef);
    
    if (snapshot.empty) return;

    const batch = writeBatch(db);
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `teams/${teamId}/messages`);
  }
};

export const uploadProjectFile = async (teamId: string, file: File) => {
  try {
    const fileRef = ref(storage, `teams/${teamId}/projects/${Date.now()}_${file.name}`);
    console.log(`Uploading project file: ${file.name} to ${fileRef.fullPath}`);
    const snapshot = await uploadBytes(fileRef, file);
    const url = await getDownloadURL(snapshot.ref);
    console.log(`Project file uploaded successfully: ${file.name}, URL: ${url}`);
    return { url, fileName: file.name, fileType: file.type };
  } catch (error) {
    console.error('Error uploading project file:', error);
    throw error;
  }
};

export const createTeamProject = async (project: TeamProject) => {
  try {
    await setDoc(doc(db, 'teamProjects', project.id), project);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `teamProjects/${project.id}`);
  }
};

export const updateTeamProject = async (projectId: string, updates: Partial<TeamProject>) => {
  try {
    await updateDoc(doc(db, 'teamProjects', projectId), updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `teamProjects/${projectId}`);
  }
};

export const deleteTeamProject = async (projectId: string, fileUrl?: string) => {
  try {
    await deleteDoc(doc(db, 'teamProjects', projectId));
    if (fileUrl) {
      // If there's a file in storage, try to delete it
      try {
        const fileRef = ref(storage, fileUrl);
        await deleteObject(fileRef);
      } catch (e) {
        console.warn('Could not delete file from storage:', e);
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `teamProjects/${projectId}`);
  }
};
