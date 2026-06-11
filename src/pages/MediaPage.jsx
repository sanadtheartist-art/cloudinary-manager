// src/pages/MediaPage.jsx
import { useState, useEffect, useCallback } from 'react';
import { fetchResources, fetchFolders, fetchFolderContents, searchResources, deleteResource, deleteResources } from '../lib/cloudinary';
import { useApp } from '../context/AppContext';
import MediaCard from '../components/MediaCard';
import AssetModal from '../components/AssetModal';

const TYPES = [
  { key: 'image', label: '🏞️ Images' },
  { key: 'video', label: '🎬 Videos' },
  { key: 'raw',   label: '📄 Raw' },
];

export default function MediaPage() {
  const { toast } = useApp();
  const [assets, setAssets]       = useState([]);
  const [folders, setFolders]     = useState([]);
  const [activeFolder, setActiveFolder] = useState(null);
  
  const [type, setType]           = useState('image');
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [cursor, setCursor]       = useState(null);
  const [hasMore, setHasMore]     = useState(false);
  const [search, setSearch]       = useState('');
  const [selected, setSelected]   = useState(new Set());
  const [viewMode, setViewMode]   = useState('grid');
  const [openAsset, setOpenAsset] = useState(null);

  // Load Folders
  useEffect(() => {
    fetchFolders().then(data => setFolders(data.folders || [])).catch(() => {});
  }, []);

  const load = useCallback(async (t = type, reset = true, cur = null, q = search, folder = activeFolder) => {
    setLoading(true); setError('');
    try {
      let data;
      if (q.trim()) {
        const expression = `resource_type:${t} AND ${q.trim()}`;
        data = await searchResources(expression, reset ? null : cur);
      } else if (folder) {
        data = await fetchFolderContents(folder, t, reset ? null : cur);
      } else {
        data = await fetchResources(t, reset ? null : cur);
      }
      
      const newAssets = data.resources || [];
      setAssets(prev => reset ? newAssets : [...prev, ...newAssets]);
      setCursor(data.next_cursor || null);
      setHasMore(!!data.next_cursor);
    } catch (e) { setError(e.message); toast(e.message, 'error'); }
    finally { setLoading(false); }
  }, [type, search, activeFolder, toast]);

  // Handle Debounced Search & Tab Changes
  useEffect(() => {
    const timer = setTimeout(() => { load(type, true, null, search, activeFolder); }, 500);
    return () => clearTimeout(timer);
  }, [type, search, activeFolder]); // eslint-disable-line

  useEffect(() => setSelected(new Set()), [type, activeFolder, search]);

  const toggleSelect = (id) => setSelected(s => {
    const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n;
  });

  const selectAll = () => setSelected(new Set(assets.map(a => a.public_id)));
  const clearSel  = () => setSelected(new Set());

  const handleDelete = async (asset) => {
    if (!confirm(`Delete "${asset.public_id.split('/').pop()}"?`)) return;
    try {
      await deleteResource(asset.public_id, asset.resource_type);
      setAssets(a => a.filter(x => x.public_id !== asset.public_id));
      toast('Deleted', 'success');
    } catch (e) { toast('Delete failed: ' + e.message, 'error'); }
  };

  const bulkDelete = async () => {
    if (!selected.size || !confirm(`Delete ${selected.size} assets? This cannot be undone.`)) return;
    try {
      await deleteResources([...selected], type);
      setAssets(a => a.filter(x => !selected.has(x.public_id)));
      clearSel();
      toast(`Deleted ${selected.size} assets`, 'success');
    } catch (e) { toast('Bulk delete failed: ' + e.message, 'error'); }
  };

  return (
    <div className="flex h-full min-h-0">
      
      {/* Folder Sidebar */}
      <div className="w-48 flex-shrink-0 border-r border-white/5 bg-black/40 backdrop-blur-md overflow-y-auto hidden md:flex flex-col">
        <div className="p-4 text-xs font-bold text-white/30 uppercase tracking-widest">Folders</div>
        <div className="px-2 space-y-1">
          <button onClick={() => setActiveFolder(null)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${!activeFolder ? 'bg-indigo-500/20 text-indigo-300' : 'text-white/60 hover:bg-white/5'}`}>
            📁 All Media
          </button>
          {folders.map(f => (
            <button key={f.path} onClick={() => setActiveFolder(f.path)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors truncate ${activeFolder === f.path ? 'bg-indigo-500/20 text-indigo-300' : 'text-white/60 hover:bg-white/5'}`}
              title={f.path}>
              📂 {f.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-white/5 glass-panel flex-shrink-0 z-10">
          <div className="flex gap-1 rounded-xl p-1 bg-black/40 border border-white/5 shadow-inner">
            {TYPES.map(({ key, label }) => (
              <button key={key} onClick={() => setType(key)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-300
                  ${type === key ? 'bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'text-white/40 hover:text-white/80'}`}>
                {label}
              </button>
            ))}
          </div>

          <div className="flex-1 max-w-xs relative ml-2 group">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm group-focus-within:text-indigo-400 transition-colors">🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search API..."
              className="w-full bg-black/30 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-indigo-500/50 focus:bg-black/50 transition-all shadow-inner" />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button onClick={selected.size === assets.length && assets.length > 0 ? clearSel : selectAll}
              className="px-3 py-1.5 text-xs font-semibold text-white/50 hover:text-white hover:bg-white/10 rounded-xl transition-all">
              {selected.size === assets.length && assets.length > 0 ? 'Deselect all' : 'Select all'}
            </button>
            <div className="flex bg-black/40 border border-white/5 rounded-xl overflow-hidden p-0.5">
              {[['grid', '⊞'], ['list', '☰']].map(([mode, icon]) => (
                <button key={mode} onClick={() => setViewMode(mode)}
                  className={`w-8 h-7 flex items-center justify-center text-sm rounded-lg transition-all ${viewMode === mode ? 'bg-white/10 text-white shadow-sm' : 'text-white/30 hover:text-white/60'}`}>
                  {icon}
                </button>
              ))}
            </div>
            <button onClick={() => load(type, true)} className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 rounded-xl transition-all border border-transparent hover:border-white/10">↺</button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-5 min-h-0 relative">
          {loading && assets.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center gap-3 text-white/40 glass-panel z-50">
              <div className="w-6 h-6 border-2 border-white/10 border-t-indigo-500 rounded-full animate-spin shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
              <span className="font-medium tracking-widest text-sm uppercase">Loading</span>
            </div>
          )}
          {error && !loading && (
            <div className="flex flex-col items-center justify-center h-64 gap-4 text-white/40 animate-fade-in">
              <span className="text-5xl drop-shadow-[0_0_15px_rgba(255,0,0,0.3)]">⚠️</span>
              <p className="text-sm text-rose-400 font-medium">{error}</p>
              <button onClick={() => load(type, true)} className="px-5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-semibold text-sm rounded-xl border border-rose-500/20 transition-all shadow-[0_0_10px_rgba(244,63,94,0.1)]">Retry</button>
            </div>
          )}
          {!loading && !error && assets.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-white/20 animate-fade-in">
              <span className="text-5xl opacity-50">✨</span>
              <p className="text-sm font-medium">No assets found</p>
            </div>
          )}
          {assets.length > 0 && (
            <div className={`animate-fade-in ${viewMode === 'grid'
              ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4'
              : 'flex flex-col gap-2'}`}>
              {assets.map(asset => (
                <MediaCard key={asset.public_id} asset={asset}
                  selected={selected.has(asset.public_id)}
                  onSelect={toggleSelect}
                  onOpen={setOpenAsset}
                  onDelete={handleDelete}
                  viewMode={viewMode} />
              ))}
            </div>
          )}
          {hasMore && (
            <div className="flex justify-center mt-8 pb-4">
              <button onClick={() => load(type, false, cursor)} disabled={loading}
                className="px-8 py-3 bg-white/5 hover:bg-white/10 text-white/80 text-sm font-bold tracking-wide rounded-xl border border-white/10 transition-all shadow-[0_0_15px_rgba(255,255,255,0.05)] disabled:opacity-40">
                {loading ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </div>

        {/* Bulk bar */}
        {selected.size > 0 && (
          <div className="absolute bottom-0 left-0 right-0 flex items-center gap-4 px-6 py-4 border-t border-white/10 glass-panel animate-slide-in shadow-[0_-10px_30px_rgba(0,0,0,0.5)] z-50">
            <span className="text-sm font-bold text-indigo-400 drop-shadow-[0_0_5px_rgba(99,102,241,0.5)]">{selected.size} selected</span>
            <div className="w-px h-5 bg-white/20" />
            <button onClick={clearSel} className="text-sm font-medium text-white/40 hover:text-white transition-colors">✕ Clear</button>
            <button onClick={bulkDelete}
              className="ml-auto px-5 py-2.5 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-[0_0_15px_rgba(244,63,94,0.4)] active:scale-95 transition-all">
              🗑️ Delete Items
            </button>
          </div>
        )}

        {openAsset && (
          <AssetModal asset={openAsset} onClose={() => setOpenAsset(null)}
            onDelete={handleDelete} onRename={() => load(type, true)} />
        )}
      </div>
    </div>
  );
}
