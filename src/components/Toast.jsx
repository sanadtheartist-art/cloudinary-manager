// src/components/Toast.jsx
import { useApp } from '../context/AppContext';

const icons = { success: '✅', error: '❌', info: 'ℹ️', warn: '⚠️' };

export default function Toast() {
  const { toasts = [] } = useApp() ?? {};
  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium shadow-2xl pointer-events-auto
            backdrop-blur-sm border animate-slide-in max-w-xs
            ${t.type === 'success' ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-300' : ''}
            ${t.type === 'error'   ? 'bg-red-950/90 border-red-500/40 text-red-300' : ''}
            ${t.type === 'info'    ? 'bg-blue-950/90 border-blue-500/40 text-blue-300' : ''}
            ${t.type === 'warn'    ? 'bg-amber-950/90 border-amber-500/40 text-amber-300' : ''}
          `}
        >
          <span>{icons[t.type] || 'ℹ️'}</span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}
