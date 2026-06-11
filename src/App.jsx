// src/App.jsx
import { useState } from 'react';
import { useApp } from './context/AppContext';
import AuthScreen    from './components/AuthScreen';
import SetupScreen   from './components/SetupScreen';
import DashboardPage from './pages/DashboardPage';
import MediaPage     from './pages/MediaPage';
import UploadPage    from './pages/UploadPage';
import SettingsPage  from './pages/SettingsPage';
import Toast         from './components/Toast';

const NAV = [
  { id: 'dashboard', icon: '📊', label: 'Dashboard',  section: 'Library' },
  { id: 'media',     icon: '🖼️', label: 'All Media',   section: null },
  { id: 'upload',    icon: '⬆️', label: 'Upload',      section: 'Manage' },
  { id: 'settings',  icon: '⚙️', label: 'Settings',    section: 'Account' },
];

function Sidebar({ page, onNav, user, credentials, onLogout }) {
  const initial = (user?.email || 'U')[0].toUpperCase();
  let lastSection = null;

  return (
    <aside className="w-56 flex-shrink-0 flex flex-col h-full border-r border-white/10 glass-panel z-20">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/[0.05]">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-600 flex items-center justify-center text-lg shadow-[0_0_15px_rgba(99,102,241,0.5)]">☁️</div>
        <div>
          <div className="font-bold text-white text-[15px] leading-tight tracking-wide">CloudManager</div>
          <div className="text-[10px] text-white/40 font-mono mt-0.5 truncate max-w-[130px]">{credentials?.cloudName || 'not connected'}</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-1">
        {NAV.map(({ id, icon, label, section }) => {
          const showSection = section && section !== lastSection;
          lastSection = section;
          return (
            <div key={id}>
              {showSection && <div className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] px-3 py-2 mt-3">{section}</div>}
              <button onClick={() => onNav(id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left group relative overflow-hidden
                  ${page === id
                    ? 'text-white shadow-[0_4px_20px_-4px_rgba(99,102,241,0.3)] bg-white/10'
                    : 'text-white/50 hover:text-white/90 hover:bg-white/5'}`}>
                {/* Active highlight bar */}
                {page === id && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1/2 bg-indigo-500 rounded-r-full shadow-[0_0_10px_rgba(99,102,241,0.8)]" />}
                
                <span className={`text-base w-6 text-center transition-transform ${page === id ? 'scale-110 drop-shadow-lg' : 'group-hover:scale-110'}`}>{icon}</span>
                {label}
              </button>
            </div>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t border-white/[0.05] bg-black/20">
        <div className="flex items-center gap-3 px-3 py-2.5 mb-2 rounded-xl bg-white/5 border border-white/5 backdrop-blur-md">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 border border-white/10 flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow-inner">{initial}</div>
          <div className="text-xs text-white/60 truncate flex-1 font-medium">{user?.email}</div>
        </div>
        <button onClick={onLogout}
          className="w-full px-3 py-2 text-xs text-white/40 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors text-left font-semibold flex items-center gap-2">
          <span className="text-[10px]">⎋</span> Sign Out
        </button>
      </div>
    </aside>
  );
}

export default function App() {
  const { user, credentials, authStatus, logout } = useApp();
  const [page, setPage] = useState('dashboard');

  if (authStatus === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#000' }}>
        <div className="w-8 h-8 border-2 border-white/10 border-t-blue-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (authStatus === 'auth')  return <><AuthScreen /><Toast /></>;
  if (authStatus === 'setup') return <><SetupScreen /><Toast /></>;

  const pageComponents = {
    dashboard: <DashboardPage onNavigate={setPage} />,
    media:     <MediaPage />,
    upload:    <UploadPage />,
    settings:  <SettingsPage />,
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden text-white bg-gradient-to-br from-indigo-950 via-slate-900 to-black relative">
      {/* Abstract background blobs for glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-600/20 rounded-full blur-[120px] pointer-events-none" />

      <Sidebar page={page} onNav={setPage} user={user} credentials={credentials} onLogout={logout} />

      {/* Main */}
      <main className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative z-10">
        {/* Topbar */}
        <header className="flex items-center gap-3 px-6 h-14 border-b border-white/[0.05] flex-shrink-0 glass-panel">
          <h1 className="text-sm font-semibold text-white/80 capitalize flex-1 tracking-wide">
            {NAV.find(n => n.id === page)?.label || page}
          </h1>
          <button onClick={() => setPage('upload')}
            className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-400 hover:to-violet-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-blue-500/20 active:scale-95 transition-all">
            <span className="text-[10px]">➕</span> Upload
          </button>
        </header>

        {/* Page */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {pageComponents[page] || pageComponents.dashboard}
        </div>
      </main>

      <Toast />
    </div>
  );
}
