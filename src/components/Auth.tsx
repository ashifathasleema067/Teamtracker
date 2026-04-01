import React from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { Trophy, LogIn, ShieldCheck, Zap, Users } from 'lucide-react';

export default function Auth() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to sign in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    { icon: Zap, title: 'Track Tasks', desc: 'Manage your daily work with ease.' },
    { icon: Users, title: 'Team Collaboration', desc: 'Work together with your teammates.' },
    { icon: ShieldCheck, title: 'Secure Access', desc: 'Your data is protected and private.' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0c0c1d] via-[#1a1a3a] to-[#0c0c1d] flex items-center justify-center p-4 overflow-hidden relative">
      {/* Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-pink-500/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] animate-pulse delay-700" />

      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-2 glass-card overflow-hidden border-white/10 relative z-10 shadow-2xl shadow-black/50">
        {/* Left Side - Branding */}
        <div className="p-12 text-white flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-white/10 to-transparent border-r border-white/5">
          <div className="relative z-10">
            <div className="bg-gradient-to-br from-pink-500 to-rose-600 w-16 h-16 rounded-2xl flex items-center justify-center mb-8 backdrop-blur-md border border-white/20 shadow-lg shadow-pink-500/20">
              <Trophy size={32} className="text-white" />
            </div>
            <h1 className="text-4xl font-black tracking-tight mb-4 leading-tight">
              Boost Your Team's Productivity.
            </h1>
            <p className="text-white/60 text-lg font-medium max-w-sm">
              The ultimate workspace for teams to track progress, collaborate, and stay motivated.
            </p>
          </div>

          <div className="relative z-10 space-y-6 mt-12">
            {features.map((f, i) => (
              <div key={i} className="flex items-center gap-4 group">
                <div className="p-3 bg-white/5 rounded-xl group-hover:bg-white/10 transition-colors border border-white/5">
                  <f.icon size={20} className="text-indigo-400" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">{f.title}</h4>
                  <p className="text-xs text-white/40">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side - Login */}
        <div className="p-12 flex flex-col justify-center items-center text-center">
          <div className="max-w-xs w-full">
            <h2 className="text-3xl font-black text-white mb-2">Get Started</h2>
            <p className="text-white/40 mb-10 font-medium">Join your team and start tracking your achievements today.</p>

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 text-red-400 rounded-2xl text-sm font-bold flex items-center gap-2 animate-in slide-in-from-top-2 border border-red-500/20">
                <ShieldCheck size={18} />
                {error}
              </div>
            )}

            <button
              onClick={handleLogin}
              disabled={isLoading}
              className="w-full glass-button py-4 px-6 rounded-2xl font-bold flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                  <span className="text-white">Continue with Google</span>
                </>
              )}
            </button>

            <p className="mt-8 text-xs text-white/20 font-medium leading-relaxed">
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
