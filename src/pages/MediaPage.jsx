// src/pages/MediaPage.jsx
import { useState, useEffect, useCallback } from 'react';
import { fetchResources, deleteResource, deleteResources } from '../lib/cloudinary';
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
  const [type, setType]           = useState('image');
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [cursor, setCursor]       = useState(null);
  const [hasMore, setHasMore]     = useState(false);
  const [search, setSearch]       = useState('');
  const [selected, setSelected]   = useState(new Set());
  const [viewMode, setViewMode]   = useState('grid');
  const [openAsset, setOpenAsset] = useState(null);

  const load = useCallback(async (t = type, reset = true, cur = null) => {
    setLoading(true); setError('');
    try {
      const data = await fetchResources(t, reset ? null : cur);
      const newAssets = data.resources || [];
      setAssets(prev => reset ? newAssets : [...prev, ...newAssets]);
      setCursor(data.next_cursor || null);
      setHasMore(!!data.next_cursor);
    } catch (e) { setError(e.message); toast(e.message, 'error'); }
    finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { load(type, true); setSelected(new Set()); }, [type]);

  const toggleSelect = (id) => setSelected(s => {
    const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n;
  });

  const filtered = search.trim()
    ? assets.filter(a => a.public_id.toLowerCase().includes(search.toLowerCase()))
    : assets;

  const selectAll = () => setSelected(new Set(filtered.map(a => a.public_id)));
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
    <div className="flex flex-col h-full min-h-0">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-white/[0.05] flex-shrink-0" style={{ background: '#050505' }}>
        {/* Type tabs */}
        <div className="flex gap-1 rounded-xl p-1 border border-white/[0.06]" style={{ background: '#0a0a0a' }}>
          {TYPES.map(({ key, label }) => (
            <button key={key} onClick={() => setType(key)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all
                ${type === key ? 'bg-white/10 text-white shadow' : 'text-white/30 hover:text-white/60'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex-1 max-w-xs relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 text-sm">🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
            className="w-full bg-white/[0.04] border border-white/[0.07] rounded-xl pl-8 pr-3 py-2 text-sm text-white placeholder-white/20 outline-none focus:border-blue-500/50 transition-colors" />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button onClick={selected.size === filtered.length && filtered.length > 0 ? clearSel : selectAll}
            className="px-3 py-1.5 text-xs text-white/30 hover:text-white/60 border border-white/[0.07] hover:border-white/[0.12] rounded-xl transition-all">
            {selected.size === filtered.length && filtered.length > 0 ? 'Deselect all' : 'Select all'}
          </button>
          <div className="flex border border-white/[0.07] rounded-xl overflow-hidden" style={{ background: '#0a0a0a' }}>
            {[['grid', '⊞'], ['list', '☰']].map(([mode, icon]) => (
              <button key={mode} onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 text-sm transition-all ${viewMode === mode ? 'bg-white/10 text-white' : 'text-white/25 hover:text-white/50'}`}>
                {icon}
              </button>
            ))}
          </div>
          <button onClick={() => load(type, true)} className="px-3 py-1.5 text-xs text-white/30 hover:text-white/60 border border-white/[0.07] hover:border-white/[0.12] rounded-xl transition-all">↺</button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-5 min-h-0">
        {loading && assets.length === 0 && (
          <div className="flex items-center justify-center h-64 gap-3 text-white/30">
            <div className="w-5 h-5 border-2 border-white/10 border-t-blue-400 rounded-full animate-spin" />
            Loading…
          </div>
        )}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center h-64 gap-3 text-white/30">
            <span className="text-4xl">⚠️</span>
            <p className="text-sm text-red-400/80">{error}</p>
            <button onClick={() => load(type, true)} className="px-4 py-2 bg-white/[0.04] hover:bg-white/[0.08] text-white/60 text-sm rounded-xl border border-white/[0.07] transition-all">Retry</button>
          </div>
        )}
        {!loading && !error && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 gap-2 text-white/20">
            <span className="text-4xl">🏜️</span>
            <p className="text-sm">No assets found</p>
          </div>
        )}
        {filtered.length > 0 && (
          <div className={viewMode === 'grid'
            ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3'
            : 'flex flex-col gap-1.5'}>
            {filtered.map(asset => (
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
          <div className="flex justify-center mt-6">
            <button onClick={() => load(type, false, cursor)} disabled={loading}
              className="px-6 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] text-white/60 text-sm font-medium rounded-xl border border-white/[0.07] transition-all disabled:opacity-40">
              {loading ? 'Loading…' : 'Load More'}
            </button>
          </div>
        )}
      </div>

      {/* Bulk bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-4 px-5 py-3 border-t border-white/[0.06] flex-shrink-0" style={{ background: '#080808' }}>
          <span className="text-sm font-semibold text-blue-400">{selected.size} selected</span>
          <div className="w-px h-4 bg-white/10" />
          <button onClick={clearSel} className="text-sm text-white/30 hover:text-white/60 transition-colors">✕ Clear</button>
          <button onClick={bulkDelete}
            className="ml-auto px-4 py-2 bg-red-500/8 hover:bg-red-500/15 text-red-400 text-xs font-semibold rounded-xl border border-red-500/10 transition-all">
            🗑️ Delete {selected.size} items
          </button>
        </div>
      )}

      {openAsset && (
        <AssetModal asset={openAsset} onClose={() => setOpenAsset(null)}
          onDelete={handleDelete} onRename={() => load(type, true)} />
      )}
    </div>
  );
}
