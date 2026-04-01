export type UserRole = 'Captain' | 'Vice Captain' | 'Manager' | 'Strategist' | 'Member';

export interface UserProfile {
  uid: string;
  displayName: string;
  fullName?: string;
  rollNumber?: string;
  role?: UserRole;
  email: string;
  photoURL: string;
  phoneNumber?: string;
  activityPoints?: number;
  primarySkills?: string[];
  secondarySkills?: string[];
  teamId: string;
  streak: number;
  lastActive: string;
  joinDate?: string;
  completedTasksCount?: number;
}

export interface TaskSubmission {
  userId: string;
  userName: string;
  userPhoto?: string;
  files: { name: string; url: string; type: string }[];
  timestamp: string;
  comment?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  deadline: string;
  status: 'pending' | 'completed';
  points: number;
  authorId: string;
  teamId: string;
  completedAt?: string;
  earnedPoints?: number;
  submissions?: TaskSubmission[];
}

export interface Team {
  id: string;
  name: string;
  memberCount: number;
  captainId?: string;
  viceCaptainId?: string;
  managerId?: string;
  strategistId?: string;
}

export interface TeamStats {
  totalTasks: number;
  completedTasks: number;
  activityPoints: number;
}

export interface TeamProject {
  id: string;
  teamId: string;
  title: string;
  description: string;
  fileUrl?: string;
  fileName?: string;
  link?: string;
  uploadedBy: string;
  uploaderName: string;
  rollNumber: string;
  uploadDate: string;
  type: 'file' | 'link';
  fileType?: string; // pdf, ppt, zip, image, doc, etc.
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  rollNumber: string;
  role: string;
  text: string;
  timestamp: string;
}
