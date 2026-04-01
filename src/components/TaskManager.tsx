import React from 'react';
import { 
  Plus, 
  Calendar, 
  CheckCircle2, 
  Circle, 
  Trash2, 
  Edit3, 
  Clock,
  AlertCircle,
  Search,
  Filter,
  X,
  Trophy,
  AlertTriangle,
  Upload,
  Image as ImageIcon,
  FileText,
  Paperclip
} from 'lucide-react';
import { Task, TaskSubmission, UserProfile } from '../types';
import { cn, getPointsForTask } from '../utils';
import { createTask, updateTaskStatus, deleteTask, updateTask, submitTask, getUserProfile } from '../services/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

interface TaskManagerProps {
  tasks: Task[];
  userId: string;
  teamId: string;
  teamMembers: UserProfile[];
}

export default function TaskManager({ tasks, userId, teamId, teamMembers }: TaskManagerProps) {
  const [isAddingTask, setIsAddingTask] = React.useState(false);
  const [editingTask, setEditingTask] = React.useState<Task | null>(null);
  const [deletingTaskId, setDeletingTaskId] = React.useState<string | null>(null);
  const [viewingSubmission, setViewingSubmission] = React.useState<{member: UserProfile, submission: TaskSubmission} | null>(null);
  const [submittingTask, setSubmittingTask] = React.useState<Task | null>(null);
  const [submissionFiles, setSubmissionFiles] = React.useState<File[]>([]);
  const [submissionComment, setSubmissionComment] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [newTask, setNewTask] = React.useState({ title: '', description: '', deadline: '' });
  const [filter, setFilter] = React.useState<'all' | 'pending' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = React.useState('');

  const filteredTasks = tasks
    .filter(task => {
      const matchesFilter = filter === 'all' || task.status === filter;
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            task.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    })
    .sort((a, b) => {
      // Pending first, then by deadline
      if (a.status !== b.status) {
        return a.status === 'pending' ? -1 : 1;
      }
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    });

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title || !newTask.deadline) return;

    const task: Task = {
      id: crypto.randomUUID(),
      title: newTask.title,
      description: newTask.description,
      deadline: new Date(newTask.deadline).toISOString(),
      status: 'pending',
      points: 0,
      authorId: userId,
      teamId: teamId,
    };

    await createTask(task);
    setNewTask({ title: '', description: '', deadline: '' });
    setIsAddingTask(false);
  };

  const handleEditTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask || !editingTask.title || !editingTask.deadline) return;

    await updateTask(editingTask.id, {
      title: editingTask.title,
      description: editingTask.description,
      deadline: new Date(editingTask.deadline).toISOString(),
    });
    setEditingTask(null);
  };

  const toggleTaskStatus = async (task: Task) => {
    const newStatus = task.status === 'pending' ? 'completed' : 'pending';
    await updateTaskStatus(task, newStatus, 0, userId, teamId);
  };

  const confirmDelete = async () => {
    if (deletingTaskId) {
      await deleteTask(deletingTaskId);
      setDeletingTaskId(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSubmissionFiles(Array.from(e.target.files));
    }
  };

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submittingTask || submissionFiles.length === 0) return;

    setIsSubmitting(true);
    try {
      const userProfile = await getUserProfile(userId);
      await submitTask(
        submittingTask.id,
        userId,
        userProfile?.fullName || userProfile?.displayName || 'Unknown',
        userProfile?.photoURL,
        submissionFiles,
        submissionComment
      );
      
      // Optionally mark as completed if it's the first submission
      if (submittingTask.status === 'pending') {
        await updateTaskStatus(submittingTask, 'completed', 0, userId, teamId);
      }

      setSubmittingTask(null);
      setSubmissionFiles([]);
      setSubmissionComment('');
    } catch (error) {
      console.error('Error submitting proof:', error);
      alert('Error submitting proof: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDebugUpload = async () => {
    try {
      const blob = new Blob(['test'], { type: 'text/plain' });
      const file = new File([blob], 'test.txt', { type: 'text/plain' });
      const fileRef = ref(storage, `debug/${userId}/${Date.now()}_test.txt`);
      console.log('Attempting debug upload to:', fileRef.fullPath);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      alert('Debug upload successful! URL: ' + url);
    } catch (error) {
      console.error('Debug upload failed:', error);
      alert('Debug upload failed: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white">Tasks</h2>
          <p className="text-white/60 mt-1 font-medium">Manage your daily goals.</p>
          <button 
            onClick={handleDebugUpload}
            className="text-[10px] text-indigo-400 hover:underline mt-2 opacity-50 hover:opacity-100 transition-opacity"
          >
            Debug Storage Connection
          </button>
        </div>
        <button 
          onClick={() => setIsAddingTask(true)}
          className="glass-button-pink text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-pink-500/20"
        >
          <Plus size={20} />
          New Task
        </button>
      </header>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
          <input 
            type="text" 
            placeholder="Search tasks..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 glass-input rounded-xl text-white placeholder:text-white/20 bg-white/5 border-white/10"
          />
        </div>
        <div className="flex gap-2 glass-card p-1 rounded-xl border border-white/10 bg-white/5 backdrop-blur-3xl">
          {(['all', 'pending', 'completed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all",
                filter === f ? "bg-indigo-500/20 text-indigo-400" : "text-white/40 hover:text-white/60"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Task List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredTasks.length > 0 ? (
          filteredTasks.map((task) => (
            <div 
              key={task.id} 
              className={cn(
                "glass-card p-6 rounded-2xl transition-all group border border-white/10 bg-white/5 backdrop-blur-3xl",
                task.status === 'completed' ? "opacity-60" : "hover:bg-white/10"
              )}
            >
              <div className="flex items-start gap-4">
                <button 
                  onClick={() => toggleTaskStatus(task)}
                  className={cn(
                    "mt-1 transition-colors",
                    task.status === 'completed' ? "text-indigo-400" : "text-white/20 hover:text-indigo-400"
                  )}
                >
                  {task.status === 'completed' ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                </button>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className={cn(
                        "text-lg font-bold truncate",
                        task.status === 'completed' ? "text-white/40 line-through" : "text-white"
                      )}>
                        {task.title}
                      </h3>
                      <p className={cn(
                        "text-sm mt-1 line-clamp-2",
                        task.status === 'completed' ? "text-white/40" : "text-white/60"
                      )}>
                        {task.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => setEditingTask(task)}
                        className="p-2 text-white/40 hover:text-indigo-400 hover:bg-white/5 rounded-lg transition-colors border border-white/10"
                      >
                        <Edit3 size={18} />
                      </button>
                      <button 
                        onClick={() => setDeletingTaskId(task.id)}
                        className="p-2 text-white/40 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors border border-white/10"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 mt-4 text-xs font-medium">
                    <div className="flex items-center gap-1.5 text-white/40">
                      <Calendar size={14} />
                      {new Date(task.deadline).toLocaleDateString()}
                    </div>
                    <div className={cn(
                      "flex items-center gap-1.5",
                      new Date(task.deadline) < new Date() && task.status === 'pending' ? "text-red-400" : "text-white/40"
                    )}>
                      <Clock size={14} />
                      {new Date(task.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  {/* Submissions Section */}
                  {teamMembers && teamMembers.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-white/5 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] flex items-center gap-2">
                          <Paperclip size={10} />
                          Submission Status
                        </h4>
                        <div className="flex gap-3 text-[10px] font-bold">
                          <span className="text-indigo-400">
                            {task.submissions?.length || 0} Submitted
                          </span>
                          <span className="text-white/20">
                            {teamMembers.length - (task.submissions?.length || 0)} Pending
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {teamMembers.map((member) => {
                          const submission = task.submissions?.find(s => s.userId === member.uid);
                          return (
                            <div 
                              key={member.uid} 
                              onClick={() => submission && setViewingSubmission({ member, submission })}
                              className={cn(
                                "flex items-center justify-between p-2 rounded-xl border transition-all",
                                submission 
                                  ? "bg-indigo-500/5 border-indigo-500/20 cursor-pointer hover:bg-indigo-500/10" 
                                  : "bg-white/5 border-white/5 opacity-50"
                              )}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="relative">
                                  <img 
                                    src={member.photoURL || `https://picsum.photos/seed/${member.uid}/32/32`} 
                                    alt={member.displayName} 
                                    className="w-6 h-6 rounded-full border border-white/10 object-cover" 
                                    referrerPolicy="no-referrer"
                                  />
                                  {submission && (
                                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-indigo-500 rounded-full border-2 border-[#1a1a1a] flex items-center justify-center">
                                      <CheckCircle2 size={6} className="text-white" />
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-[10px] text-white font-bold truncate">{member.fullName || member.displayName}</p>
                                  <p className="text-[8px] text-white/40 uppercase tracking-wider">{member.rollNumber || 'No Roll'}</p>
                                </div>
                              </div>
                              
                              {submission ? (
                                <div className="flex items-center gap-2">
                                  <div className="flex -space-x-1">
                                    {submission.files.slice(0, 3).map((file, fidx) => (
                                      <div 
                                        key={fidx} 
                                        className="w-4 h-4 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400"
                                      >
                                        {file.type.startsWith('image/') ? <ImageIcon size={8} /> : <FileText size={8} />}
                                      </div>
                                    ))}
                                    {submission.files.length > 3 && (
                                      <div className="w-4 h-4 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-[6px] text-indigo-400 font-bold">
                                        +{submission.files.length - 3}
                                      </div>
                                    )}
                                  </div>
                                  <span className="text-[8px] font-bold text-indigo-400 uppercase tracking-wider bg-indigo-500/10 px-1.5 py-0.5 rounded">
                                    View
                                  </span>
                                </div>
                              ) : (
                                <span className="text-[8px] font-black text-white/20 uppercase tracking-widest px-2 py-0.5 bg-white/5 rounded-full">
                                  Pending
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  {teamId && (
                    <button 
                      onClick={() => setSubmittingTask(task)}
                      className="mt-4 w-full py-3 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-xs font-black uppercase tracking-widest rounded-2xl border border-indigo-500/20 transition-all flex items-center justify-center gap-2 group/btn active:scale-[0.98]"
                    >
                      <Upload size={14} className="group-hover/btn:-translate-y-0.5 transition-transform" />
                      {task.status === 'completed' ? 'Add Another Submission' : 'Submit Proof'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="glass-card border-dashed border-white/10 rounded-3xl p-12 text-center">
            <div className="bg-white/5 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="text-white/10" size={32} />
            </div>
            <h3 className="text-lg font-bold text-white">No tasks found</h3>
            <p className="text-white/40 mt-1 max-w-xs mx-auto">
              {searchQuery ? "Try adjusting your search or filters." : "Start by creating your first task!"}
            </p>
          </div>
        )}
      </div>

      {/* Add/Edit Task Modal */}
      {(isAddingTask || editingTask) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="glass-card w-full max-w-lg rounded-3xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">
                {isAddingTask ? 'Create New Task' : 'Edit Task'}
              </h3>
              <button 
                onClick={() => {
                  setIsAddingTask(false);
                  setEditingTask(null);
                }} 
                className="p-2 text-white/40 hover:bg-white/10 rounded-xl transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={isAddingTask ? handleAddTask : handleEditTask} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-white/40">Task Title</label>
                <input 
                  required
                  type="text" 
                  placeholder="e.g., Complete UI Design" 
                  value={isAddingTask ? newTask.title : editingTask?.title || ''}
                  onChange={(e) => isAddingTask 
                    ? setNewTask({ ...newTask, title: e.target.value })
                    : setEditingTask(prev => prev ? { ...prev, title: e.target.value } : null)
                  }
                  className="w-full px-4 py-3 glass-input rounded-xl text-white placeholder:text-white/20 bg-white/5 border-white/10"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-white/40">Description (Optional)</label>
                <textarea 
                  placeholder="Add more details about this task..." 
                  value={isAddingTask ? newTask.description : editingTask?.description || ''}
                  onChange={(e) => isAddingTask
                    ? setNewTask({ ...newTask, description: e.target.value })
                    : setEditingTask(prev => prev ? { ...prev, description: e.target.value } : null)
                  }
                  className="w-full px-4 py-3 glass-input rounded-xl text-white placeholder:text-white/20 h-24 resize-none bg-white/5 border-white/10"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-white/40">Deadline</label>
                <input 
                  required
                  type="datetime-local" 
                  value={isAddingTask ? newTask.deadline : (editingTask?.deadline ? new Date(editingTask.deadline).toISOString().slice(0, 16) : '')}
                  onChange={(e) => isAddingTask
                    ? setNewTask({ ...newTask, deadline: e.target.value })
                    : setEditingTask(prev => prev ? { ...prev, deadline: e.target.value } : null)
                  }
                  className="w-full px-4 py-3 glass-input rounded-xl text-white placeholder:text-white/20 bg-white/5 border-white/10"
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => {
                    setIsAddingTask(false);
                    setEditingTask(null);
                  }}
                  className="flex-1 py-3 text-sm font-bold text-white/40 hover:bg-white/10 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 glass-button-pink text-white text-sm font-bold rounded-xl shadow-lg shadow-pink-500/20"
                >
                  {isAddingTask ? 'Create Task' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Submit Proof Modal */}
      {submittingTask && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="glass-card w-full max-w-lg rounded-3xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">Submit Proof</h3>
                <p className="text-xs text-white/40 mt-1 font-medium">{submittingTask.title}</p>
              </div>
              <button 
                onClick={() => {
                  setSubmittingTask(null);
                  setSubmissionFiles([]);
                  setSubmissionComment('');
                }} 
                className="p-2 text-white/40 hover:bg-white/10 rounded-xl transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmitProof} className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-white/30 uppercase tracking-widest">Upload Files & Photos</label>
                <div className="relative group">
                  <input 
                    type="file" 
                    multiple
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.zip"
                  />
                  <div className="border-2 border-dashed border-white/10 rounded-2xl p-8 text-center group-hover:border-indigo-500/30 transition-all bg-white/5">
                    <div className="bg-indigo-500/10 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 text-indigo-400 group-hover:scale-110 transition-transform">
                      <Upload size={24} />
                    </div>
                    <p className="text-sm font-bold text-white">Click or drag files to upload</p>
                    <p className="text-xs text-white/40 mt-1">Images, PDF, DOC, ZIP supported</p>
                  </div>
                </div>
                
                {submissionFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {submissionFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-xl border border-white/10 text-xs text-white font-medium">
                        <Paperclip size={12} className="text-indigo-400" />
                        <span className="truncate max-w-[120px]">{file.name}</span>
                        <button 
                          type="button"
                          onClick={() => setSubmissionFiles(prev => prev.filter((_, i) => i !== idx))}
                          className="text-white/20 hover:text-red-400 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-white/30 uppercase tracking-widest">Comment (Optional)</label>
                <textarea 
                  placeholder="Add any notes about your submission..." 
                  value={submissionComment}
                  onChange={(e) => setSubmissionComment(e.target.value)}
                  className="glass-input w-full p-4 rounded-2xl text-sm text-white placeholder:text-white/20 min-h-[100px] resize-none"
                />
              </div>

              <button 
                type="submit"
                disabled={isSubmitting || submissionFiles.length === 0}
                className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-indigo-500/20 active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all flex items-center justify-center gap-3"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={20} />
                    <span>Complete Submission</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingTaskId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="glass-card w-full max-w-sm rounded-3xl p-8 text-center animate-in zoom-in-95 duration-200">
            <div className="bg-red-500/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-red-500/20">
              <AlertTriangle className="text-red-400" size={32} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Delete Task?</h3>
            <p className="text-white/40 mb-8 font-medium">
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setDeletingTaskId(null)}
                className="flex-1 py-3 text-sm font-bold text-white/40 hover:bg-white/10 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 py-3 bg-red-500/20 hover:bg-red-500/40 text-red-400 text-sm font-bold rounded-xl transition-all active:scale-95 border border-red-500/20"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Submission Modal */}
      {viewingSubmission && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[70] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="glass-card w-full max-w-lg rounded-3xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img 
                  src={viewingSubmission.member.photoURL || `https://picsum.photos/seed/${viewingSubmission.member.uid}/40/40`} 
                  alt={viewingSubmission.member.displayName} 
                  className="w-10 h-10 rounded-full border border-white/10 object-cover" 
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h3 className="text-lg font-bold text-white">{viewingSubmission.member.fullName || viewingSubmission.member.displayName}</h3>
                  <p className="text-xs text-white/40 font-medium">Submitted on {new Date(viewingSubmission.submission.timestamp).toLocaleString()}</p>
                </div>
              </div>
              <button 
                onClick={() => setViewingSubmission(null)} 
                className="p-2 text-white/40 hover:bg-white/10 rounded-xl transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {viewingSubmission.submission.comment && (
                <div className="space-y-2">
                  <h4 className="text-[10px] font-black text-white/30 uppercase tracking-widest">Comment</h4>
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                    <p className="text-sm text-white/80 leading-relaxed italic">
                      "{viewingSubmission.submission.comment}"
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-white/30 uppercase tracking-widest">Submitted Files ({viewingSubmission.submission.files.length})</h4>
                <div className="grid grid-cols-1 gap-2">
                  {viewingSubmission.submission.files.map((file, idx) => (
                    <a 
                      key={idx}
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all group/file"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover/file:scale-110 transition-transform">
                          {file.type.startsWith('image/') ? <ImageIcon size={20} /> : <FileText size={20} />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-white truncate">{file.name}</p>
                          <p className="text-[10px] text-white/40 uppercase tracking-wider">{file.type.split('/')[1] || 'File'}</p>
                        </div>
                      </div>
                      <div className="px-3 py-1.5 bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-lg border border-indigo-500/20">
                        Download
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="p-6 bg-white/5 border-t border-white/10">
              <button 
                onClick={() => setViewingSubmission(null)}
                className="w-full py-3 text-sm font-bold text-white/40 hover:bg-white/10 rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
