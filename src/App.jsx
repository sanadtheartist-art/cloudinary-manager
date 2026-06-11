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
    <aside className="w-52 flex-shrink-0 flex flex-col h-full border-r border-white/[0.05]" style={{ background: '#080808' }}>
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-white/[0.05]">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-sm shadow-lg shadow-blue-500/30">☁️</div>
        <div>
          <div className="font-bold text-white text-sm leading-none">CloudManager</div>
          <div className="text-[10px] text-white/30 font-mono mt-0.5 truncate max-w-[120px]">{credentials?.cloudName || 'not connected'}</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto space-y-0.5">
        {NAV.map(({ id, icon, label, section }) => {
          const showSection = section && section !== lastSection;
          lastSection = section;
          return (
            <div key={id}>
              {showSection && <div className="text-[10px] font-semibold text-white/20 uppercase tracking-widest px-3 py-2 mt-2">{section}</div>}
              <button onClick={() => onNav(id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left
                  ${page === id
                    ? 'bg-white/10 text-white shadow-sm'
                    : 'text-white/40 hover:text-white/80 hover:bg-white/5'}`}>
                <span className="text-base w-5 text-center">{icon}</span>
                {label}
                {page === id && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400" />}
              </button>
            </div>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-2 py-3 border-t border-white/[0.05]">
        <div className="flex items-center gap-2.5 px-3 py-2.5 mb-1 rounded-xl bg-white/[0.03]">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">{initial}</div>
          <div className="text-xs text-white/40 truncate flex-1">{user?.email}</div>
        </div>
        <button onClick={onLogout}
          className="w-full px-3 py-2 text-xs text-white/30 hover:text-red-400 hover:bg-red-500/5 rounded-xl transition-all text-left font-medium">
          ⎋ Sign Out
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
    <div className="flex h-screen w-screen overflow-hidden text-white" style={{ background: '#000' }}>
      <Sidebar page={page} onNav={setPage} user={user} credentials={credentials} onLogout={logout} />

      {/* Main */}
      <main className="flex-1 flex flex-col h-full min-w-0 overflow-hidden" style={{ background: '#050505' }}>
        {/* Topbar */}
        <header className="flex items-center gap-3 px-6 h-14 border-b border-white/[0.05] flex-shrink-0" style={{ background: '#050505' }}>
          <h1 className="text-sm font-semibold text-white/70 capitalize flex-1">
            {NAV.find(n => n.id === page)?.label || page}
          </h1>
          <button onClick={() => setPage('upload')}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-violet-600 text-white text-xs font-semibold rounded-lg shadow-lg shadow-blue-500/20 hover:opacity-90 active:scale-95 transition-all">
            ⬆️ Upload
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
