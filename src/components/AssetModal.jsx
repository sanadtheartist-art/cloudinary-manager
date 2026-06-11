// src/components/AssetModal.jsx
import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { cloudinaryAPI, formatBytes } from '../lib/cloudinary';

// Cloudinary URL-based format conversion
function getConvertedUrl(asset, format) {
  if (!asset?.secure_url) return null;
  const isImage = asset.resource_type === 'image';
  const isVideo = asset.resource_type === 'video';

  if (isImage) {
    // e.g. /upload/f_webp,q_auto/
    return asset.secure_url.replace('/upload/', `/upload/f_${format},q_auto/`);
  }
  if (isVideo) {
    return asset.secure_url.replace('/upload/', `/upload/f_${format},q_auto/`);
  }
  return asset.secure_url;
}

const IMAGE_FORMATS = [
  { id: 'original', label: 'Original',  ext: '',      badge: 'src',  desc: 'Keep as-is' },
  { id: 'webp',     label: 'WebP',      ext: 'webp',  badge: 'web',  desc: 'Best for web · ~30% smaller' },
  { id: 'avif',     label: 'AVIF',      ext: 'avif',  badge: 'next', desc: 'Next-gen · ~50% smaller' },
  { id: 'jpg',      label: 'JPEG',      ext: 'jpg',   badge: 'jpg',  desc: 'Universal support' },
  { id: 'png',      label: 'PNG',       ext: 'png',   badge: 'png',  desc: 'Lossless, transparency' },
];

const VIDEO_FORMATS = [
  { id: 'original', label: 'Original',  ext: '',      badge: 'src',  desc: 'Keep as-is' },
  { id: 'webm',     label: 'WebM',      ext: 'webm',  badge: 'web',  desc: 'Best for web browsers' },
  { id: 'mp4',      label: 'MP4',       ext: 'mp4',   badge: 'mp4',  desc: 'Universal, H.264' },
  { id: 'gif',      label: 'GIF',       ext: 'gif',   badge: 'gif',  desc: 'Animated, no audio' },
];

const badgeColors = {
  src:  'bg-white/10 text-white/50',
  web:  'bg-blue-500/20 text-blue-300',
  next: 'bg-violet-500/20 text-violet-300',
  jpg:  'bg-amber-500/20 text-amber-300',
  png:  'bg-emerald-500/20 text-emerald-300',
  mp4:  'bg-orange-500/20 text-orange-300',
  gif:  'bg-pink-500/20 text-pink-300',
};

function FormatPicker({ asset }) {
  const isImage = asset.resource_type === 'image';
  const isVideo = asset.resource_type === 'video';
  const formats = isImage ? IMAGE_FORMATS : isVideo ? VIDEO_FORMATS : null;
  const [selected, setSelected] = useState('webp');
  const { toast } = useApp();

  if (!formats) return null;

  const downloadAs = () => {
    const fmt = formats.find(f => f.id === selected);
    const url  = selected === 'original' ? asset.secure_url : getConvertedUrl(asset, fmt.ext);
    const name = asset.public_id.split('/').pop() + (fmt.ext ? '.' + fmt.ext : '.' + asset.format);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.target = '_blank';
    a.rel = 'noreferrer';
    a.click();
    toast(`Downloading as ${fmt.label}…`, 'info');
  };

  const copyConverted = () => {
    const fmt = formats.find(f => f.id === selected);
    const url  = selected === 'original' ? asset.secure_url : getConvertedUrl(asset, fmt.ext);
    navigator.clipboard.writeText(url);
    toast(`${fmt.label} URL copied!`, 'success');
  };

  return (
    <div className="space-y-2">
      <div className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">
        {isImage ? 'Export Format' : 'Video Format'}
      </div>
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
        {formats.map(fmt => (
          <button key={fmt.id} onClick={() => setSelected(fmt.id)}
            className={`flex items-start gap-2 p-2.5 rounded-xl border text-left transition-all
              ${selected === fmt.id
                ? 'border-blue-500/50 bg-blue-500/10'
                : 'border-white/[0.06] bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04]'}`}>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md mt-0.5 flex-shrink-0 uppercase ${badgeColors[fmt.badge] || 'bg-white/10 text-white/40'}`}>
              {fmt.badge}
            </span>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-white/80 leading-none mb-0.5">{fmt.label}</div>
              <div className="text-[10px] text-white/30 leading-tight">{fmt.desc}</div>
            </div>
          </button>
        ))}
      </div>
      <div className="flex gap-2 pt-1">
        <button onClick={copyConverted}
          className="flex-1 py-2 text-xs font-medium text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-xl transition-all">
          Copy {formats.find(f=>f.id===selected)?.label} URL
        </button>
        <button onClick={downloadAs}
          className="flex-1 py-2 text-xs font-semibold text-white bg-gradient-to-r from-blue-500 to-violet-600 hover:opacity-90 rounded-xl transition-all shadow shadow-blue-500/20">
          ⬇️ Download as {formats.find(f=>f.id===selected)?.label}
        </button>
      </div>
    </div>
  );
}

export default function AssetModal({ asset, onClose, onDelete, onRename }) {
  const { toast } = useApp();
  const [newTag, setNewTag] = useState('');
  const [tags, setTags]     = useState(asset?.tags || []);
  const [renaming, setRenaming] = useState(false);
  const [newId, setNewId]   = useState(asset?.public_id || '');

  if (!asset) return null;

  const isImage = asset.resource_type === 'image';
  const isVideo = asset.resource_type === 'video';
  const name    = asset.public_id.split('/').pop();

  const copyUrl = () => {
    navigator.clipboard.writeText(asset.secure_url);
    toast('URL copied!', 'success');
  };

  const addTag = async () => {
    if (!newTag.trim()) return;
    try {
      const fd = new FormData();
      fd.append('public_ids[]', asset.public_id);
      fd.append('tag', newTag.trim());
      await cloudinaryAPI('POST', 'tags', fd);
      setTags(t => [...t, newTag.trim()]);
      setNewTag('');
      toast(`Tag added`, 'success');
    } catch (e) { toast('Failed: ' + e.message, 'error'); }
  };

  const removeTag = async (tag) => {
    try {
      const fd = new FormData();
      fd.append('public_ids[]', asset.public_id);
      fd.append('tag', tag);
      await cloudinaryAPI('DELETE', 'tags', fd);
      setTags(t => t.filter(x => x !== tag));
      toast('Tag removed', 'success');
    } catch (e) { toast('Failed: ' + e.message, 'error'); }
  };

  const doRename = async () => {
    if (!newId.trim() || newId === asset.public_id) return;
    try {
      const fd = new FormData();
      fd.append('to_public_id', newId.trim());
      await cloudinaryAPI('POST', `resources/${asset.resource_type}/upload/${encodeURIComponent(asset.public_id)}/rename`, fd);
      toast('Renamed!', 'success');
      onRename(); onClose();
    } catch (e) { toast('Rename failed: ' + e.message, 'error'); }
  };

  const inputClass = "w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white placeholder-white/20 outline-none focus:border-blue-500/60 transition-all";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }} onClick={onClose}>
      <div className="rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl border border-white/[0.07]"
        style={{ background: '#0c0c0c' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.06]">
          <h2 className="font-semibold text-white flex-1 truncate text-sm">{name}</h2>
          <span className="text-[10px] font-mono text-white/30 bg-white/5 px-2 py-1 rounded-md">{asset.format?.toUpperCase()}</span>
          <button onClick={onClose} className="text-white/30 hover:text-white transition-colors text-lg leading-none">✕</button>
        </div>

        <div className="p-5 space-y-5">
          {/* Preview */}
          <div className="rounded-xl overflow-hidden flex items-center justify-center min-h-[180px]" style={{ background: '#111' }}>
            {isImage && <img src={asset.secure_url?.replace('/upload/', '/upload/c_limit,w_700,q_80/')} alt="" className="max-w-full max-h-64 object-contain" />}
            {isVideo && <video controls className="max-w-full max-h-64 rounded-lg w-full"><source src={asset.secure_url} /></video>}
            {!isImage && !isVideo && <div className="py-10 text-5xl opacity-40">📄</div>}
          </div>

          {/* URL */}
          <div className="flex gap-2">
            <input readOnly value={asset.secure_url || ''} className="flex-1 bg-white/[0.03] border border-white/[0.07] rounded-xl px-3 py-2 text-xs text-white/40 font-mono outline-none truncate" />
            <button onClick={copyUrl} className="px-3 py-2 bg-white/[0.05] hover:bg-white/[0.1] text-white/60 hover:text-white text-xs font-medium rounded-xl transition-all whitespace-nowrap border border-white/[0.06]">Copy</button>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-3 gap-3">
            {[
              ['Format', asset.format?.toUpperCase()],
              ['Size', formatBytes(asset.bytes)],
              ['Type', asset.resource_type],
              ['Width', asset.width ? asset.width + 'px' : '—'],
              ['Height', asset.height ? asset.height + 'px' : '—'],
              ['Created', asset.created_at ? new Date(asset.created_at).toLocaleDateString() : '—'],
            ].map(([k, v]) => (
              <div key={k} className="bg-white/[0.02] border border-white/[0.05] rounded-xl px-3 py-2.5">
                <div className="text-[9px] text-white/25 uppercase tracking-widest font-semibold mb-1">{k}</div>
                <div className="text-xs text-white/70 font-mono">{v || '—'}</div>
              </div>
            ))}
          </div>

          {/* ── FORMAT CONVERSION ── */}
          <FormatPicker asset={asset} />

          {/* Rename */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">Rename</span>
              <button onClick={() => setRenaming(r => !r)} className="text-xs text-blue-400/70 hover:text-blue-400 transition-colors">{renaming ? 'Cancel' : '✏️ Edit'}</button>
            </div>
            {renaming && (
              <div className="flex gap-2">
                <input value={newId} onChange={e => setNewId(e.target.value)} className={inputClass} />
                <button onClick={doRename} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition-colors whitespace-nowrap">Save</button>
              </div>
            )}
          </div>

          {/* Tags */}
          <div>
            <div className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-2">Tags</div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {tags.map(tag => (
                <span key={tag} className="flex items-center gap-1.5 px-3 py-1 bg-white/[0.05] border border-white/[0.07] rounded-full text-xs text-white/60">
                  {tag}
                  <button onClick={() => removeTag(tag)} className="text-white/30 hover:text-red-400 transition-colors leading-none">✕</button>
                </span>
              ))}
              {!tags.length && <span className="text-xs text-white/20 italic">No tags</span>}
            </div>
            <div className="flex gap-2">
              <input value={newTag} onChange={e => setNewTag(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addTag()}
                placeholder="Add tag and press Enter…"
                className={inputClass} />
              <button onClick={addTag} className="px-3 py-2 bg-white/[0.05] hover:bg-white/[0.1] text-white/60 text-sm rounded-xl transition-all border border-white/[0.06] whitespace-nowrap">+ Add</button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 px-5 py-4 border-t border-white/[0.06]">
          <div className="flex-1" />
          <button onClick={() => { onDelete(asset); onClose(); }}
            className="px-4 py-2 bg-red-500/8 hover:bg-red-500/15 text-red-400 text-xs font-semibold rounded-xl border border-red-500/10 transition-all">
            🗑️ Delete Asset
          </button>
        </div>
      </div>
    </div>
  );
}
