// src/components/AuthScreen.jsx
import { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useApp } from '../context/AppContext';

export default function AuthScreen() {
  const { toast } = useApp();
  const [mode, setMode]       = useState('login');
  const [email, setEmail]     = useState('');
  const [pass, setPass]       = useState('');
  const [pass2, setPass2]     = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const humanErr = (e) => {
    const m = {
      'auth/invalid-credential':   'Wrong email or password.',
      'auth/user-not-found':       'No account with that email.',
      'auth/wrong-password':       'Wrong password.',
      'auth/email-already-in-use': 'Email already in use.',
      'auth/weak-password':        'Password must be at least 6 characters.',
      'auth/invalid-email':        'Invalid email address.',
    };
    return m[e.code] || e.message;
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (mode === 'register' && pass !== pass2) { setError("Passwords don't match."); return; }
    setLoading(true);
    try {
      if (mode === 'login') await signInWithEmailAndPassword(auth, email, pass);
      else await createUserWithEmailAndPassword(auth, email, pass);
    } catch (err) { setError(humanErr(err)); }
    finally { setLoading(false); }
  };

  const inputClass = "w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-blue-500/60 focus:bg-white/[0.06] transition-all";

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#000' }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-xl shadow-xl shadow-blue-500/20">☁️</div>
          <div>
            <div className="font-bold text-white text-lg leading-none">CloudManager</div>
            <div className="text-[10px] text-white/25 font-mono mt-0.5 uppercase tracking-wider">Powered by Cloudinary</div>
          </div>
        </div>

        <div className="rounded-2xl p-8 shadow-2xl border border-white/[0.06]" style={{ background: '#0a0a0a' }}>
          <h1 className="text-xl font-bold text-white mb-1">
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </h1>
          <p className="text-sm text-white/30 mb-6">
            {mode === 'login' ? 'Sign in to manage your assets' : 'Set up your account'}
          </p>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/8 border border-red-500/20 text-red-400 text-sm">{error}</div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-1.5">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="you@example.com" autoComplete="email" className={inputClass} />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-1.5">Password</label>
              <input type="password" value={pass} onChange={e => setPass(e.target.value)} required
                placeholder="••••••••" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} className={inputClass} />
            </div>
            {mode === 'register' && (
              <div>
                <label className="block text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-1.5">Confirm Password</label>
                <input type="password" value={pass2} onChange={e => setPass2(e.target.value)} required
                  placeholder="••••••••" autoComplete="new-password" className={inputClass} />
              </div>
            )}
            <button type="submit" disabled={loading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-violet-600 text-white font-semibold text-sm shadow-lg shadow-blue-500/20 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40 mt-2">
              {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-white/25 mt-5">
            {mode === 'login' ? "Don't have an account? " : 'Already have one? '}
            <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
              className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
              {mode === 'login' ? 'Create one' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
