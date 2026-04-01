import React from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, Message } from '../types';
import { Send, MessageSquare, User as UserIcon, Clock, Trash2, AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clearTeamChat } from '../services/firestore';

interface TeamChatProps {
  userProfile: UserProfile;
}

export default function TeamChat({ userProfile }: TeamChatProps) {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [newMessage, setNewMessage] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [showClearConfirm, setShowClearConfirm] = React.useState(false);
  const [isClearing, setIsClearing] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const canClearChat = userProfile.role === 'Captain' || userProfile.role === 'Manager';

  const handleClearChat = async () => {
    if (!userProfile.teamId || !canClearChat) return;
    
    setIsClearing(true);
    try {
      await clearTeamChat(userProfile.teamId);
      setShowClearConfirm(false);
    } catch (error) {
      console.error('Error clearing chat:', error);
    } finally {
      setIsClearing(false);
    }
  };

  React.useEffect(() => {
    if (!userProfile.teamId) return;

    const q = query(
      collection(db, 'teams', userProfile.teamId, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setMessages(msgs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userProfile.teamId]);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !userProfile.teamId) return;

    try {
      const messageData = {
        senderId: userProfile.uid,
        senderName: userProfile.fullName || userProfile.displayName,
        rollNumber: userProfile.rollNumber || 'N/A',
        role: userProfile.role || 'Member',
        text: newMessage.trim(),
        timestamp: serverTimestamp()
      };

      setNewMessage('');
      await addDoc(collection(db, 'teams', userProfile.teamId, 'messages'), messageData);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-white/10 border-t-pink-500 rounded-full animate-spin" />
          <p className="text-white/60 font-medium">Loading team chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] glass-card overflow-hidden border border-white/10 bg-white/5 backdrop-blur-3xl">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
            <MessageSquare size={20} />
          </div>
          <div>
            <h2 className="font-bold text-white">Team Chat</h2>
            <p className="text-xs text-white/40 font-medium">Real-time communication with your team</p>
          </div>
        </div>
        
        {canClearChat && messages.length > 0 && (
          <button
            onClick={() => setShowClearConfirm(true)}
            className="p-2 text-white/40 hover:text-red-400 hover:bg-white/5 rounded-lg transition-all flex items-center gap-2 text-sm font-medium border border-white/10"
            title="Clear Chat"
          >
            <Trash2 size={18} />
            <span className="hidden sm:inline">Clear Chat</span>
          </button>
        )}
      </div>

      {/* Clear Confirmation Modal */}
      <AnimatePresence>
        {showClearConfirm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card w-full max-w-sm p-8"
            >
              <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 mb-6">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Clear Chat History?</h3>
              <p className="text-white/40 text-sm mb-8 font-medium">
                This will permanently delete all messages for everyone in the team. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 glass-button px-6 py-3 text-white/60 border-white/10 bg-white/5 hover:bg-white/10"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleClearChat}
                  disabled={isClearing}
                  className="flex-1 py-3 rounded-2xl font-bold bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50 shadow-lg shadow-red-500/20 border border-red-500/20"
                >
                  {isClearing ? 'Clearing...' : 'Clear All'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-4 bg-white/5"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-white/20 gap-2">
            <MessageSquare size={48} strokeWidth={1} />
            <p className="font-medium">No messages yet</p>
            <p className="text-sm">Start the conversation!</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg) => {
              const isMe = msg.senderId === userProfile.uid;
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    {!isMe && (
                      <div className="flex items-center gap-2 mb-1 px-1">
                        <span className="text-xs font-bold text-white/80">{msg.senderName}</span>
                        <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider border border-indigo-500/20">
                          {msg.role}
                        </span>
                        <span className="text-[10px] text-white/40 font-mono">{msg.rollNumber}</span>
                      </div>
                    )}
                    <div className={`
                      px-4 py-2 rounded-2xl shadow-sm text-sm relative group
                      ${isMe 
                        ? 'bg-indigo-600 text-white rounded-tr-none shadow-lg shadow-indigo-500/20' 
                        : 'bg-white/10 text-white border border-white/10 rounded-tl-none shadow-sm backdrop-blur-md'}
                    `}>
                      <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                      <div className={`
                        flex items-center gap-1 mt-1 text-[10px]
                        ${isMe ? 'text-indigo-100 justify-end' : 'text-white/40 justify-start'}
                      `}>
                        <Clock size={10} />
                        {formatTime(msg.timestamp)}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Input Area */}
      <form 
        onSubmit={handleSendMessage}
        className="p-4 border-t border-white/10 flex items-center gap-3"
      >
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="glass-input flex-1 px-4 py-3 text-sm text-white placeholder:text-white/20 bg-white/5 border-white/10"
        />
        <button
          type="submit"
          disabled={!newMessage.trim()}
          className="glass-button-pink w-12 h-12 flex items-center justify-center disabled:opacity-50 shadow-lg shadow-pink-500/20"
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
}
