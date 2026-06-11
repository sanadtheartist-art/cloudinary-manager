// src/components/SetupScreen.jsx
import { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useApp } from '../context/AppContext';

export default function SetupScreen() {
  const { user, setCredentials, setAuthStatus, toast } = useApp();
  const [form, setForm]     = useState({ cloudName: '', apiKey: '', apiSecret: '', uploadPreset: '' });
  const [showSec, setShowSec] = useState(false);
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    if (!form.cloudName || !form.apiKey || !form.apiSecret) { setError('Cloud name, API key and secret are required.'); return; }
    setLoading(true);
    try {
      await setDoc(doc(db, 'credentials', user.uid), form);
      sessionStorage.setItem('cld_creds', JSON.stringify(form));
      setCredentials(form);
      setAuthStatus('app');
      toast('Cloudinary connected!', 'success');
    } catch (e) { setError('Failed to save: ' + e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#080a0f] px-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-xl">☁️</div>
          <div className="font-bold text-white text-lg">CloudManager</div>
        </div>
        <div className="bg-[#111520] border border-slate-800 rounded-2xl p-8 shadow-2xl">
          <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-3 py-1 text-xs font-semibold text-violet-300 uppercase tracking-wider mb-4">
            ⚙️ First-time Setup
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Connect Cloudinary</h2>
          <p className="text-sm text-slate-400 mb-4">Enter your Cloudinary credentials. Stored securely in your account — only you can see them.</p>
          <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg px-4 py-3 text-xs text-slate-400 mb-6 leading-relaxed">
            Find these at{' '}
            <a href="https://console.cloudinary.com" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">console.cloudinary.com</a>
            {' '}→ Settings → API Keys
          </div>

          {error && <div className="mb-4 px-4 py-3 rounded-lg bg-red-950/60 border border-red-500/30 text-red-300 text-sm">{error}</div>}

          <form onSubmit={save} className="space-y-4">
            {[
              { id: 'cloudName', label: 'Cloud Name', placeholder: 'e.g. dfwusklvk', type: 'text' },
              { id: 'apiKey',    label: 'API Key',    placeholder: '123456789012345',  type: 'text' },
            ].map(({ id, label, placeholder, type }) => (
              <div key={id}>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">{label}</label>
                <input type={type} placeholder={placeholder} value={form[id]}
                  onChange={e => setForm(f => ({ ...f, [id]: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" />
              </div>
            ))}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">API Secret</label>
              <div className="relative">
                <input type={showSec ? 'text' : 'password'} placeholder="••••••••••••••••••••••"
                  value={form.apiSecret} onChange={e => setForm(f => ({ ...f, apiSecret: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2.5 pr-10 text-sm text-white placeholder-slate-600 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" />
                <button type="button" onClick={() => setShowSec(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors text-sm">
                  {showSec ? '🙈' : '👁'}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Upload Preset <span className="normal-case font-normal text-slate-600">(optional)</span></label>
              <input type="text" placeholder="my_unsigned_preset" value={form.uploadPreset}
                onChange={e => setForm(f => ({ ...f, uploadPreset: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-2.5 rounded-lg bg-gradient-to-r from-blue-500 to-violet-600 text-white font-semibold text-sm shadow-lg hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 mt-2">
              {loading ? 'Saving…' : 'Connect & Continue →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
