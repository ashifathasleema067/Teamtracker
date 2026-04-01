import React from 'react';
import { 
  User as UserIcon, 
  Hash, 
  Shield, 
  Save, 
  AlertCircle,
  CheckCircle2,
  X,
  Mail,
  Code,
  Cpu,
  Trophy
} from 'lucide-react';
import { UserProfile, UserRole, Team } from '../types';
import { updateUserProfileAndTeamRole, checkRollNumberUniqueness } from '../services/firestore';
import { cn } from '../utils';

interface ProfileEditorProps {
  user: UserProfile;
  team: Team;
  onClose: () => void;
}

export default function ProfileEditor({ user, team, onClose }: ProfileEditorProps) {
  const [fullName, setFullName] = React.useState(user.fullName || '');
  const [rollNumber, setRollNumber] = React.useState(user.rollNumber || '');
  const [email, setEmail] = React.useState(user.email || '');
  const [activityPoints, setActivityPoints] = React.useState(user.activityPoints?.toString() || '0');
  const [primarySkill1, setPrimarySkill1] = React.useState(user.primarySkills?.[0] || '');
  const [primarySkill2, setPrimarySkill2] = React.useState(user.primarySkills?.[1] || '');
  const [secondarySkill1, setSecondarySkill1] = React.useState(user.secondarySkills?.[0] || '');
  const [secondarySkill2, setSecondarySkill2] = React.useState(user.secondarySkills?.[1] || '');
  const [role, setRole] = React.useState<UserRole>(user.role || 'Member');
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  const roles: UserRole[] = ['Captain', 'Vice Captain', 'Manager', 'Strategist', 'Member'];

  // Check if a role is available in the team
  const isRoleAvailable = (_r: UserRole) => {
    return true; // Everyone can select any role as per user request
  };

  const validateRollNumber = (roll: string) => {
    if (!roll) return true; // Optional
    return roll.length <= 50; // Relaxed validation
  };

  const isRollNumberInvalid = rollNumber && !validateRollNumber(rollNumber);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(false);

    // Roll number validation
    if (rollNumber && !validateRollNumber(rollNumber)) {
      setError('Roll number is too long (max 50 characters)');
      setIsSaving(false);
      return;
    }

    try {
      // Check roll number uniqueness if it's being set for the first time or changed
      if (rollNumber && rollNumber !== user.rollNumber) {
        const isUnique = await checkRollNumberUniqueness(user.teamId, rollNumber, user.uid);
        if (!isUnique) {
          setError('This roll number already exists in your team');
          setIsSaving(false);
          return;
        }
      }

      // If user is Captain and trying to change role, they must assign a new Captain first
      if (user.role === 'Captain' && role !== 'Captain') {
        setError('You cannot change your role from Captain without assigning a new Captain first.');
        setIsSaving(false);
        return;
      }

        await updateUserProfileAndTeamRole(
        user.uid, 
        {
          fullName,
          rollNumber,
          email,
          activityPoints: Number(activityPoints),
          primarySkills: [primarySkill1, primarySkill2].map(s => s.trim()).filter(Boolean),
          secondarySkills: [secondarySkill1, secondarySkill2].map(s => s.trim()).filter(Boolean),
          role,
          lastActive: new Date().toISOString()
        },
        user.teamId,
        user.role || 'Member',
        role
      );

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="glass-card w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <UserIcon className="text-indigo-400" />
              Edit Profile
            </h2>
            <button onClick={onClose} className="p-2 text-white/40 hover:bg-white/10 rounded-xl transition-all">
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            <div className="space-y-2">
              <label className="text-sm font-bold text-white/40 flex items-center gap-2">
                <UserIcon size={16} className="text-white/20" />
                Full Name
              </label>
              <input 
                type="text" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name..."
                className="glass-input w-full px-4 py-3 text-sm"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-white/40 flex items-center gap-2">
                <Mail size={16} className="text-white/20" />
                Email Address
              </label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email..."
                className="glass-input w-full px-4 py-3 text-sm"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-white/40 flex items-center gap-2">
                <Hash size={16} className="text-white/20" />
                Roll Number
              </label>
              <input 
                type="text" 
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
                placeholder="737625XXXXXX"
                className={cn(
                  "glass-input w-full px-4 py-3 text-sm",
                  isRollNumberInvalid && "border-red-500/50 focus:ring-red-500/20"
                )}
              />
              {isRollNumberInvalid && (
                <p className="text-[10px] text-red-500 font-bold animate-in fade-in slide-in-from-top-1">
                  Roll number is too long (max 50 characters)
                </p>
              )}
              {!isRollNumberInvalid && (
                <p className="text-[10px] text-white/40 font-medium italic">Enter your unique roll number.</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-white/40 flex items-center gap-2">
                <Trophy size={16} className="text-white/20" />
                Activity Points
              </label>
              <input 
                type="text" 
                value={activityPoints}
                onFocus={() => {
                  if (activityPoints === '0') setActivityPoints('');
                }}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || /^\d+$/.test(val)) {
                    setActivityPoints(val);
                  }
                }}
                placeholder="Enter activity points"
                className="glass-input w-full px-4 py-3 text-sm"
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-bold text-white/40 flex items-center gap-2">
                <Code size={16} className="text-white/20" />
                Primary Skills (Add 2)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <input 
                  type="text" 
                  value={primarySkill1}
                  onChange={(e) => setPrimarySkill1(e.target.value)}
                  placeholder="Skill 1..."
                  className="glass-input w-full px-4 py-3 text-sm"
                />
                <input 
                  type="text" 
                  value={primarySkill2}
                  onChange={(e) => setPrimarySkill2(e.target.value)}
                  placeholder="Skill 2..."
                  className="glass-input w-full px-4 py-3 text-sm"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-bold text-white/40 flex items-center gap-2">
                <Cpu size={16} className="text-white/20" />
                Secondary Skills (Add 2)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <input 
                  type="text" 
                  value={secondarySkill1}
                  onChange={(e) => setSecondarySkill1(e.target.value)}
                  placeholder="Skill 1..."
                  className="glass-input w-full px-4 py-3 text-sm"
                />
                <input 
                  type="text" 
                  value={secondarySkill2}
                  onChange={(e) => setSecondarySkill2(e.target.value)}
                  placeholder="Skill 2..."
                  className="glass-input w-full px-4 py-3 text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-white/40 flex items-center gap-2">
                <Shield size={16} className="text-white/20" />
                Team Role
              </label>
              <div className="grid grid-cols-2 gap-2">
                {roles.map((r) => {
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={cn(
                        "px-4 py-2 rounded-xl text-xs font-bold border transition-all relative overflow-hidden",
                        role === r 
                          ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-400 shadow-sm" 
                          : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:text-white"
                      )}
                    >
                      {r}
                    </button>
                  );
                })}
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 text-red-400 p-4 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in slide-in-from-top-2">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            {success && (
              <div className="bg-emerald-500/10 text-emerald-400 p-4 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in slide-in-from-top-2">
                <CheckCircle2 size={16} />
                Profile updated successfully!
              </div>
            )}

            <button 
              type="submit"
              disabled={isSaving || success || isRollNumberInvalid}
              className="glass-button-pink w-full py-4 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSaving ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save size={18} />
                  Save Profile
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
