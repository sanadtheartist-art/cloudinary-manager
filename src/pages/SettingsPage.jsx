// src/pages/SettingsPage.jsx
import { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useApp } from '../context/AppContext';
import { cloudinaryAPI } from '../lib/cloudinary';

// ── tiny helper components ────────────────────────────────────
function MaskedValue({ value, masked = false, mono = true }) {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied]   = useState(false);
  if (!value) return <span className="text-white/20 italic text-xs">not set</span>;

  const display = masked && !visible
    ? value.slice(0, 4) + '•'.repeat(Math.max(4, value.length - 8)) + value.slice(-4)
    : value;

  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <span className="flex items-center gap-1.5 min-w-0">
      <span className={`text-xs ${mono ? 'font-mono' : ''} text-white/60 truncate`}>{display}</span>
      {masked && (
        <button onClick={() => setVisible(v => !v)} className="text-white/25 hover:text-white/50 text-[10px] flex-shrink-0 transition-colors">
          {visible ? '🙈' : '👁'}
        </button>
      )}
      <button onClick={copy} className={`text-[10px] px-1.5 py-0.5 rounded transition-all flex-shrink-0
        ${copied ? 'text-emerald-400 bg-emerald-400/10' : 'text-white/20 hover:text-white/50 hover:bg-white/5'}`}>
        {copied ? '✓' : 'copy'}
      </button>
    </span>
  );
}

// ── Profile Card (read-only view) ──────────────────────────────
function ProfileCard({ profile, isActive, onActivate, onEdit, onDelete, onTest }) {
  const [testStatus, setTestStatus] = useState('idle');

  const handleTest = async () => {
    setTestStatus('testing');
    try {
      await onTest(profile);
      setTestStatus('ok');
      setTimeout(() => setTestStatus('idle'), 3000);
    } catch {
      setTestStatus('fail');
      setTimeout(() => setTestStatus('idle'), 3000);
    }
  };

  return (
    <div className={`rounded-2xl border transition-all ${isActive
      ? 'border-blue-500/40 shadow-lg shadow-blue-500/5'
      : 'border-white/[0.06] hover:border-white/[0.1]'}`}
      style={{ background: isActive ? 'rgba(59,130,246,0.04)' : '#0a0a0a' }}>

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.05]">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0 font-bold
          ${isActive ? 'bg-gradient-to-br from-blue-500 to-violet-600 text-white shadow-md shadow-blue-500/30' : 'bg-white/[0.06] text-white/40'}`}>
          {profile.name[0]?.toUpperCase() || '?'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white truncate">{profile.name}</span>
            {isActive && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-blue-400 bg-blue-400/10 border border-blue-400/20 px-2 py-0.5 rounded-full flex-shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" />
                ACTIVE
              </span>
            )}
          </div>
          <div className="text-[11px] text-white/30 font-mono mt-0.5 truncate">{profile.cloudName || 'no cloud name'}</div>
        </div>
        {/* Test status */}
        {testStatus === 'ok'      && <span className="text-xs text-emerald-400 flex-shrink-0">✅</span>}
        {testStatus === 'fail'    && <span className="text-xs text-red-400 flex-shrink-0">❌</span>}
        {testStatus === 'testing' && <div className="w-4 h-4 border-2 border-white/10 border-t-blue-400 rounded-full animate-spin flex-shrink-0" />}
      </div>

      {/* Credential rows */}
      <div className="px-4 py-3 space-y-2.5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[10px] text-white/25 uppercase tracking-widest font-semibold w-20 flex-shrink-0">Cloud</span>
          <MaskedValue value={profile.cloudName} />
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-[10px] text-white/25 uppercase tracking-widest font-semibold w-20 flex-shrink-0">API Key</span>
          <MaskedValue value={profile.apiKey} />
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-[10px] text-white/25 uppercase tracking-widest font-semibold w-20 flex-shrink-0">Secret</span>
          <MaskedValue value={profile.apiSecret} masked />
        </div>
        {profile.uploadPreset && (
          <div className="flex items-center justify-between gap-3">
            <span className="text-[10px] text-white/25 uppercase tracking-widest font-semibold w-20 flex-shrink-0">Preset</span>
            <MaskedValue value={profile.uploadPreset} />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 px-4 pb-4 pt-2">
        {!isActive && (
          <button onClick={() => onActivate(profile.id)}
            className="flex-1 py-2 text-xs font-semibold text-white bg-gradient-to-r from-blue-500 to-violet-600 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all shadow shadow-blue-500/20">
            ⚡ Switch to this
          </button>
        )}
        <button onClick={handleTest} disabled={testStatus === 'testing'}
          className={`py-2 text-xs font-medium rounded-xl border transition-all disabled:opacity-40
            ${isActive ? 'flex-1' : ''}
            text-blue-400/70 hover:text-blue-400 bg-blue-400/5 hover:bg-blue-400/10 border-blue-400/15`}>
          {testStatus === 'testing' ? 'Testing…' : '⚡ Test'}
        </button>
        <button onClick={() => onEdit(profile)}
          className="py-2 px-3 text-xs font-medium rounded-xl border border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.07] text-white/40 hover:text-white/70 transition-all">
          ✏️
        </button>
        <button onClick={() => onDelete(profile.id)}
          className="py-2 px-3 text-xs font-medium rounded-xl border border-red-500/10 bg-red-500/5 hover:bg-red-500/10 text-red-400/60 hover:text-red-400 transition-all">
          🗑️
        </button>
      </div>
    </div>
  );
}

// ── Profile Form (add / edit) ──────────────────────────────────
function ProfileForm({ initial, onSave, onCancel }) {
  const [form, setForm]     = useState(initial);
  const [showSec, setShowSec] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useApp();

  const handle = async (e) => {
    e.preventDefault();
    if (!form.name || !form.cloudName || !form.apiKey || !form.apiSecret) {
      toast('Fill Name, Cloud Name, API Key and Secret.', 'error'); return;
    }
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  const inputClass = "w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-blue-500/60 focus:bg-white/[0.06] transition-all";

  return (
    <form onSubmit={handle} className="rounded-2xl border border-blue-500/30 overflow-hidden shadow-xl shadow-blue-500/5" style={{ background: '#0d0d0d' }}>
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.06]">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/30 to-violet-600/30 border border-blue-500/30 flex items-center justify-center text-sm">☁️</div>
        <div>
          <div className="text-sm font-semibold text-white">{initial.cloudName ? 'Edit Profile' : 'Add New Profile'}</div>
          <div className="text-[11px] text-white/30">
            <a href="https://console.cloudinary.com" target="_blank" rel="noreferrer" className="text-blue-400/70 hover:text-blue-400">console.cloudinary.com</a>
            {' '}→ Settings → API Keys
          </div>
        </div>
        <button type="button" onClick={onCancel} className="ml-auto text-white/30 hover:text-white/60 transition-colors text-lg leading-none">✕</button>
      </div>

      <div className="p-5 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-1.5">Profile Name <span className="text-red-400">*</span></label>
            <input type="text" value={form.name} placeholder="e.g. My Main Cloud, Client Project…"
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputClass} />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-1.5">Cloud Name <span className="text-red-400">*</span></label>
            <input type="text" value={form.cloudName} placeholder="dfwusklvk"
              onChange={e => setForm(f => ({ ...f, cloudName: e.target.value }))} className={inputClass} />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-1.5">API Key <span className="text-red-400">*</span></label>
            <input type="text" value={form.apiKey} placeholder="123456789012345"
              onChange={e => setForm(f => ({ ...f, apiKey: e.target.value }))} className={inputClass} />
          </div>
          <div className="col-span-2">
            <label className="block text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-1.5">API Secret <span className="text-red-400">*</span></label>
            <div className="relative">
              <input type={showSec ? 'text' : 'password'} value={form.apiSecret} placeholder="••••••••••••••••••••••"
                onChange={e => setForm(f => ({ ...f, apiSecret: e.target.value }))} className={`${inputClass} pr-10`} />
              <button type="button" onClick={() => setShowSec(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50 text-sm transition-colors">
                {showSec ? '🙈' : '👁'}
              </button>
            </div>
          </div>
          <div className="col-span-2">
            <label className="block text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-1.5">
              Upload Preset <span className="text-white/15 font-normal normal-case">(optional)</span>
            </label>
            <input type="text" value={form.uploadPreset} placeholder="my_unsigned_preset"
              onChange={e => setForm(f => ({ ...f, uploadPreset: e.target.value }))} className={inputClass} />
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onCancel}
            className="px-5 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] text-white/40 hover:text-white/70 text-sm font-medium rounded-xl border border-white/[0.07] transition-all">
            Cancel
          </button>
          <button type="submit" disabled={saving}
            className="flex-1 py-2.5 bg-gradient-to-r from-blue-500 to-violet-600 text-white font-semibold text-sm rounded-xl shadow-lg shadow-blue-500/20 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40">
            {saving ? 'Saving…' : '💾 Save Profile'}
          </button>
        </div>
      </div>
    </form>
  );
}

// ── Main Settings Page ─────────────────────────────────────────
export default function SettingsPage() {
  const { user, profiles, activeProfileId, switchProfile, saveProfile, deleteProfile, addBlankProfile, toast, logout } = useApp();
  const [editing, setEditing] = useState(null); // profile being edited, or 'new'

  const handleSave = async (form) => {
    await saveProfile(form);
    toast(`Profile "${form.name}" saved!`, 'success');
    setEditing(null);
  };

  const handleDelete = async (id) => {
    const p = profiles.find(x => x.id === id);
    if (!confirm(`Delete profile "${p?.name}"?`)) return;
    await deleteProfile(id);
    toast('Profile deleted', 'success');
  };

  const handleTest = async (profile) => {
    // Temporarily set session creds to this profile's creds for the test
    const prev = sessionStorage.getItem('cld_creds');
    sessionStorage.setItem('cld_creds', JSON.stringify(profile));
    try {
      const r = await cloudinaryAPI('GET', 'resources/image?max_results=1');
      if (r.resources === undefined) throw new Error('Unexpected');
      toast(`✅ "${profile.name}" connected!`, 'success');
    } catch (e) {
      toast(`❌ "${profile.name}": ${e.message}`, 'error');
      throw e;
    } finally {
      sessionStorage.setItem('cld_creds', prev || 'null');
    }
  };

  const handleSwitch = async (id) => {
    await switchProfile(id);
    const p = profiles.find(x => x.id === id);
    toast(`Switched to "${p?.name}"`, 'success');
  };

  const resetPassword = async () => {
    if (!user?.email) return;
    await sendPasswordResetEmail(auth, user.email);
    toast('Password reset email sent!', 'success');
  };

  const newProfile = editing === 'new' ? addBlankProfile() : null;

  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-2xl mx-auto w-full space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-white">Settings</h1>
        <button onClick={() => setEditing('new')}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-gradient-to-r from-blue-500 to-violet-600 text-white rounded-xl shadow shadow-blue-500/20 hover:opacity-90 active:scale-95 transition-all">
          + Add Profile
        </button>
      </div>

      {/* ── NEW / EDIT FORM ── */}
      {editing && (
        <ProfileForm
          initial={editing === 'new' ? addBlankProfile() : editing}
          onSave={handleSave}
          onCancel={() => setEditing(null)} />
      )}

      {/* ── PROFILES LIST ── */}
      <div>
        <div className="text-[10px] font-semibold text-white/25 uppercase tracking-widest mb-3">
          Cloudinary Profiles · {profiles.length} saved
        </div>

        {profiles.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-white/20 rounded-2xl border border-white/[0.04]" style={{ background: '#0a0a0a' }}>
            <span className="text-4xl">☁️</span>
            <p className="text-sm">No profiles yet</p>
            <button onClick={() => setEditing('new')}
              className="mt-1 px-5 py-2 bg-gradient-to-r from-blue-500 to-violet-600 text-white text-sm font-semibold rounded-xl shadow hover:opacity-90">
              Add your first profile
            </button>
          </div>
        )}

        <div className="space-y-3">
          {profiles.map(profile => (
            <ProfileCard
              key={profile.id}
              profile={profile}
              isActive={profile.id === activeProfileId}
              onActivate={handleSwitch}
              onEdit={p => setEditing(p)}
              onDelete={handleDelete}
              onTest={handleTest} />
          ))}
        </div>
      </div>

      {/* ── ACCOUNT ── */}
      <div className="rounded-2xl border border-white/[0.06] overflow-hidden" style={{ background: '#0a0a0a' }}>
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.06]">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-xs font-bold text-white">
            {(user?.email || 'U')[0].toUpperCase()}
          </div>
          <div>
            <div className="text-sm font-semibold text-white">Account</div>
            <div className="text-xs text-white/30 font-mono">{user?.email}</div>
          </div>
        </div>
        <div className="p-5 flex gap-3">
          <button onClick={resetPassword}
            className="px-4 py-2 bg-white/[0.04] hover:bg-white/[0.08] text-white/50 hover:text-white/80 text-sm font-medium rounded-xl border border-white/[0.06] transition-all">
            🔑 Change Password
          </button>
          <button onClick={logout}
            className="px-4 py-2 bg-red-500/5 hover:bg-red-500/10 text-red-400/80 hover:text-red-400 text-sm font-medium rounded-xl border border-red-500/10 transition-all">
            ⎋ Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
