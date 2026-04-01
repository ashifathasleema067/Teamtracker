import React from 'react';
import { 
  FolderOpen, 
  Plus, 
  Search, 
  Filter, 
  ExternalLink, 
  Download, 
  Trash2, 
  Edit2, 
  FileText, 
  Github, 
  Globe, 
  FileCode, 
  Image as ImageIcon, 
  FileArchive,
  MoreVertical,
  X,
  Upload,
  Link as LinkIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { TeamProject, UserProfile } from '../types';
import { cn } from '../utils';
import { createTeamProject, uploadProjectFile, deleteTeamProject, updateTeamProject } from '../services/firestore';

interface TeamProjectsProps {
  projects: TeamProject[];
  currentUser: UserProfile | null;
  onBack?: () => void;
}

export default function TeamProjects({ projects, currentUser, onBack }: TeamProjectsProps) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [filterUploader, setFilterUploader] = React.useState('all');
  const [sortBy, setSortBy] = React.useState<'newest' | 'oldest'>('newest');
  const [isUploadModalOpen, setIsUploadModalOpen] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [editingProject, setEditingProject] = React.useState<TeamProject | null>(null);

  const isCaptain = currentUser?.role === 'Captain';

  const filteredProjects = projects
    .filter(project => {
      const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          project.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesUploader = filterUploader === 'all' || project.uploadedBy === filterUploader;
      return matchesSearch && matchesUploader;
    })
    .sort((a, b) => {
      const dateA = new Date(a.uploadDate).getTime();
      const dateB = new Date(b.uploadDate).getTime();
      return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
    });

  const uniqueUploaders = Array.from(new Set(projects.map(p => ({ id: p.uploadedBy, name: p.uploaderName }))));

  const getFileIcon = (type: string, fileType?: string) => {
    if (type === 'link') {
      if (fileType === 'github') return <Github className="text-white" />;
      if (fileType === 'drive') return <Globe className="text-blue-400" />;
      return <Globe className="text-white/40" />;
    }
    
    if (fileType?.includes('pdf')) return <FileText className="text-red-400" />;
    if (fileType?.includes('image')) return <ImageIcon className="text-green-400" />;
    if (fileType?.includes('zip') || fileType?.includes('archive')) return <FileArchive className="text-orange-400" />;
    if (fileType?.includes('presentation') || fileType?.includes('powerpoint')) return <FileText className="text-orange-500" />;
    return <FileCode className="text-white/40" />;
  };

  const handleDelete = async (project: TeamProject) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    try {
      await deleteTeamProject(project.id, project.fileUrl);
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Failed to delete project.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button 
            onClick={onBack}
            className="text-sm text-white/40 hover:text-white/60 mb-2 flex items-center gap-1 transition-colors"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <FolderOpen className="text-indigo-400" size={32} />
            Team Projects
          </h1>
          <p className="text-white/60 mt-1">Shared workspace for project files and links</p>
        </div>
        
        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="glass-button-pink flex items-center justify-center gap-2 px-6 py-3"
        >
          <Plus size={20} />
          Upload Project
        </button>
      </div>

      {/* Filters & Search */}
      <div className="glass-card p-4 flex flex-col md:flex-row gap-4 border border-white/10 bg-white/5 backdrop-blur-3xl">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={20} />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="glass-input w-full pl-10 pr-4 py-2 bg-white/5 border-white/10 text-white placeholder:text-white/20"
          />
        </div>
        
        <div className="flex gap-2">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={16} />
            <select
              value={filterUploader}
              onChange={(e) => setFilterUploader(e.target.value)}
              className="glass-input pl-9 pr-8 py-2 text-sm appearance-none cursor-pointer bg-white/5 border-white/10 text-white"
            >
              <option value="all" className="bg-slate-900">All Uploaders</option>
              {uniqueUploaders.map(u => (
                <option key={u.id} value={u.id} className="bg-slate-900">{u.name}</option>
              ))}
            </select>
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="glass-input px-4 py-2 text-sm cursor-pointer bg-white/5 border-white/10 text-white"
          >
            <option value="newest" className="bg-slate-900">Newest First</option>
            <option value="oldest" className="bg-slate-900">Oldest First</option>
          </select>
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <motion.div
              key={project.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="group glass-card p-5 hover:border-white/20 transition-all duration-300 relative"
            >
              {isCaptain && (
                <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => setEditingProject(project)}
                    className="p-2 text-white/40 hover:text-indigo-400 hover:bg-white/10 rounded-xl transition-all"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(project)}
                    className="p-2 text-white/40 hover:text-rose-500 hover:bg-white/10 rounded-xl transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}

              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center group-hover:bg-indigo-500/20 transition-colors border border-white/10">
                  {getFileIcon(project.type, project.fileType)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white truncate group-hover:text-indigo-400 transition-colors">
                    {project.title}
                  </h3>
                  <p className="text-xs text-white/40">
                    {format(new Date(project.uploadDate), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>

              <p className="text-sm text-white/60 line-clamp-2 mb-4 h-10">
                {project.description || 'No description provided.'}
              </p>

              <div className="flex items-center gap-3 mb-6 p-2 bg-white/5 rounded-xl border border-white/10">
                <div className="w-8 h-8 bg-indigo-500/20 rounded-full flex items-center justify-center text-indigo-400 text-xs font-bold border border-white/10">
                  {project.uploaderName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{project.uploaderName}</p>
                  <p className="text-[10px] text-white/40 uppercase tracking-wider">{project.rollNumber}</p>
                </div>
              </div>

              <div className="flex gap-2">
                {project.type === 'link' ? (
                  <a
                    href={project.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors shadow-md"
                  >
                    <ExternalLink size={16} />
                    Open Link
                  </a>
                ) : (
                  <>
                    <a
                      href={project.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors shadow-md"
                    >
                      <ExternalLink size={16} />
                      View
                    </a>
                    <a
                      href={project.fileUrl}
                      download={project.fileName}
                      className="px-4 flex items-center justify-center bg-white/5 text-white/60 py-2.5 rounded-xl text-sm font-medium hover:bg-white/10 transition-colors border border-white/10"
                    >
                      <Download size={16} />
                    </a>
                  </>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="glass-card border-2 border-dashed border-white/10 p-12 text-center">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
            <FolderOpen className="text-white/20" size={40} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No projects found</h3>
          <p className="text-white/40 max-w-sm mx-auto mb-8">
            {searchTerm || filterUploader !== 'all' 
              ? "Try adjusting your search or filters to find what you're looking for."
              : "Start by uploading your first project file or link to share with the team."}
          </p>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="glass-button-pink inline-flex items-center gap-2 px-6 py-3"
          >
            <Plus size={20} />
            Upload Project
          </button>
        </div>
      )}

      {/* Upload Modal */}
      <AnimatePresence>
        {(isUploadModalOpen || editingProject) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card w-full max-w-lg overflow-hidden"
            >
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  {editingProject ? <Edit2 size={24} className="text-indigo-400" /> : <Upload size={24} className="text-indigo-400" />}
                  {editingProject ? 'Edit Project' : 'Upload New Project'}
                </h2>
                <button 
                  onClick={() => {
                    setIsUploadModalOpen(false);
                    setEditingProject(null);
                  }}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X size={24} className="text-white/40" />
                </button>
              </div>

              <ProjectForm 
                currentUser={currentUser} 
                editingProject={editingProject}
                onClose={() => {
                  setIsUploadModalOpen(false);
                  setEditingProject(null);
                }} 
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ProjectForm({ currentUser, editingProject, onClose }: { currentUser: UserProfile | null, editingProject: TeamProject | null, onClose: () => void }) {
  const [type, setType] = React.useState<'file' | 'link'>(editingProject?.type || 'file');
  const [title, setTitle] = React.useState(editingProject?.title || '');
  const [description, setDescription] = React.useState(editingProject?.description || '');
  const [link, setLink] = React.useState(editingProject?.link || '');
  const [file, setFile] = React.useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.teamId) {
      alert('You must be part of a team to upload projects. Please join a team first.');
      return;
    }
    if (!title) return;
    if (type === 'link' && !link) return;
    if (type === 'file' && !file && !editingProject) return;

    setIsSubmitting(true);
    try {
      let projectData: Partial<TeamProject> = {
        title,
        description,
        type,
      };

      if (type === 'link') {
        projectData.link = link;
        // Detect link type
        if (link.includes('github.com')) projectData.fileType = 'github';
        else if (link.includes('drive.google.com')) projectData.fileType = 'drive';
        else projectData.fileType = 'website';
      } else if (file) {
        const uploaded = await uploadProjectFile(currentUser.teamId, file);
        projectData.fileUrl = uploaded.url;
        projectData.fileName = uploaded.fileName;
        projectData.fileType = uploaded.fileType;
      }

      if (editingProject) {
        await updateTeamProject(editingProject.id, projectData);
      } else {
        const newProject: TeamProject = {
          id: crypto.randomUUID(),
          teamId: currentUser.teamId,
          title,
          description,
          uploadedBy: currentUser.uid,
          uploaderName: currentUser.fullName || currentUser.displayName,
          rollNumber: currentUser.rollNumber || 'N/A',
          uploadDate: new Date().toISOString(),
          type,
          ...projectData
        } as TeamProject;
        await createTeamProject(newProject);
      }
      onClose();
    } catch (error) {
      console.error('Error saving project:', error);
      alert('Error saving project: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      {!editingProject && (
        <div className="flex p-1 bg-white/5 rounded-xl border border-white/10">
          <button
            type="button"
            onClick={() => setType('file')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all",
              type === 'file' ? "bg-indigo-500/20 text-indigo-400 shadow-sm" : "text-white/40 hover:text-white/60"
            )}
          >
            <Upload size={16} />
            File Upload
          </button>
          <button
            type="button"
            onClick={() => setType('link')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all",
              type === 'link' ? "bg-indigo-500/20 text-indigo-400 shadow-sm" : "text-white/40 hover:text-white/60"
            )}
          >
            <LinkIcon size={16} />
            External Link
          </button>
        </div>
      )}

      <div className="space-y-1">
        <label className="text-xs font-bold text-white/40 uppercase tracking-wider ml-1">Project Title</label>
        <input
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter project name..."
          className="glass-input w-full px-4 py-3 bg-white/5 border-white/10 text-white placeholder:text-white/20"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-bold text-white/40 uppercase tracking-wider ml-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Briefly describe the project..."
          rows={3}
          className="glass-input w-full px-4 py-3 resize-none bg-white/5 border-white/10 text-white placeholder:text-white/20"
        />
      </div>

      {type === 'link' ? (
        <div className="space-y-1">
          <label className="text-xs font-bold text-white/40 uppercase tracking-wider ml-1">Project Link</label>
          <div className="relative">
            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
            <input
              type="url"
              required
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://github.com/..."
              className="glass-input w-full pl-10 pr-4 py-3 bg-white/5 border-white/10 text-white placeholder:text-white/20"
            />
          </div>
          <p className="text-[10px] text-white/40 ml-1">Supports GitHub, Google Drive, or any website link.</p>
        </div>
      ) : (
        <div className="space-y-1">
          <label className="text-xs font-bold text-white/40 uppercase tracking-wider ml-1">Project File</label>
          {!editingProject || file ? (
            <div className="relative group">
              <input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className={cn(
                "border-2 border-dashed rounded-2xl p-8 text-center transition-all",
                file ? "border-indigo-500/50 bg-indigo-500/5" : "border-white/10 bg-white/5 group-hover:border-white/20"
              )}>
                <Upload className={cn("mx-auto mb-2", file ? "text-indigo-400" : "text-white/20")} size={32} />
                <p className="text-sm font-medium text-white">
                  {file ? file.name : "Click or drag file to upload"}
                </p>
                <p className="text-xs text-white/40 mt-1">
                  PDF, PPT, ZIP, Images, or Documents
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="text-indigo-400" />
                <span className="text-sm font-medium text-white truncate max-w-[200px]">
                  {editingProject.fileName}
                </span>
              </div>
              <button 
                type="button"
                onClick={() => setFile(null)}
                className="text-xs text-indigo-400 font-bold hover:underline"
              >
                Change File
              </button>
            </div>
          )}
        </div>
      )}

      <div className="pt-4 flex gap-3">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 glass-button px-6 py-3"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-[2] glass-button-pink px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {editingProject ? 'Updating...' : 'Uploading...'}
            </>
          ) : (
            <>
              {editingProject ? 'Save Changes' : 'Upload Project'}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
