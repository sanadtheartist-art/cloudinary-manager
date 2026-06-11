// src/pages/DashboardPage.jsx
import { useState, useEffect } from 'react';
import { fetchResources, formatBytes } from '../lib/cloudinary';
import { useApp } from '../context/AppContext';
import MediaCard from '../components/MediaCard';
import AssetModal from '../components/AssetModal';

export default function DashboardPage({ onNavigate }) {
  const { credentials, toast } = useApp();
  const [stats, setStats] = useState({ total: '—', images: '—', videos: '—', storage: '—' });
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openAsset, setOpenAsset] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [imgData, vidData] = await Promise.all([
          fetchResources('image', null, 12),
          fetchResources('video', null, 4),
        ]);
        const imgs = imgData.resources || [];
        const vids = vidData.resources || [];
        const bytes = imgs.reduce((s, r) => s + (r.bytes || 0), 0);
        setStats({
          total: imgs.length + vids.length + '+',
          images: imgs.length + '+',
          videos: vids.length + '+',
          storage: formatBytes(bytes),
        });
        setRecent(imgs.slice(0, 8));
      } catch (e) { toast(e.message, 'error'); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const statCards = [
    { label: 'Total Assets', value: stats.total, sub: 'All resources', color: 'text-white' },
    { label: 'Images', value: stats.images, sub: 'image/*', color: 'text-blue-400' },
    { label: 'Videos', value: stats.videos, sub: 'video/*', color: 'text-violet-400' },
    { label: 'Storage Used', value: stats.storage, sub: 'Approximate', color: 'text-emerald-400' },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6">
      {/* Welcome */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-slate-400 mt-0.5">Cloud: <span className="text-blue-400 font-mono">{credentials?.cloudName || '—'}</span></p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(({ label, value, sub, color }) => (
          <div key={label} className="bg-[#111520] border border-slate-800 rounded-xl p-5">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{label}</div>
            <div className={`text-2xl font-bold font-mono tracking-tight ${color}`}>{loading ? '…' : value}</div>
            <div className="text-xs text-slate-600 mt-1">{sub}</div>
          </div>
        ))}
      </div>

      {/* Recent */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-white">Recent Uploads</h2>
        <button onClick={() => onNavigate('media')} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">View All →</button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40 gap-3 text-slate-500">
          <div className="w-5 h-5 border-2 border-slate-700 border-t-blue-400 rounded-full animate-spin" />
          Loading…
        </div>
      ) : recent.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 gap-2 text-slate-600">
          <span className="text-3xl">🏜️</span>
          <p className="text-sm">No recent uploads</p>
          <button onClick={() => onNavigate('upload')} className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg">Upload now</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-3">
          {recent.map(asset => (
            <MediaCard key={asset.public_id} asset={asset}
              selected={false} onSelect={() => {}} viewMode="grid"
              onOpen={setOpenAsset}
              onDelete={() => {}} />
          ))}
        </div>
      )}

      {openAsset && (
        <AssetModal asset={openAsset} onClose={() => setOpenAsset(null)}
          onDelete={() => {}} onRename={() => {}} />
      )}
    </div>
  );
}
