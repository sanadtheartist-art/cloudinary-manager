// src/components/AssetModal.jsx
import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { cloudinaryAPI, formatBytes } from '../lib/cloudinary';

// Dynamic Transformations
function getTransformedUrl(asset, { width, height, crop, blur, format }) {
  if (!asset?.secure_url) return null;
  const isImage = asset.resource_type === 'image';
  const isVideo = asset.resource_type === 'video';

  let transforms = [];
  if (width) transforms.push(`w_${width}`);
  if (height) transforms.push(`h_${height}`);
  if (crop && (width || height)) transforms.push(`c_${crop}`);
  if (blur && blur > 0) transforms.push(`e_blur:${blur}`);
  
  if (format && format !== 'original') transforms.push(`f_${format}`);
  transforms.push('q_auto');

  const transformString = transforms.length > 0 ? transforms.join(',') + '/' : '';
  return asset.secure_url.replace('/upload/', `/upload/${transformString}`);
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

function TransformPanel({ asset, transforms, setTransforms }) {
  if (asset.resource_type !== 'image') return null;

  return (
    <div className="bg-black/30 border border-white/5 rounded-2xl p-5 space-y-4 shadow-inner">
      <div className="text-[11px] font-bold text-indigo-300 uppercase tracking-widest mb-2">Transformations</div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] text-white/50 uppercase mb-1.5">Width (px)</label>
          <input type="number" value={transforms.width} onChange={e => setTransforms(t => ({...t, width: e.target.value}))}
            placeholder="Auto" className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-indigo-500/80 transition-all" />
        </div>
        <div>
          <label className="block text-[10px] text-white/50 uppercase mb-1.5">Height (px)</label>
          <input type="number" value={transforms.height} onChange={e => setTransforms(t => ({...t, height: e.target.value}))}
            placeholder="Auto" className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-indigo-500/80 transition-all" />
        </div>
      </div>

      <div>
        <label className="block text-[10px] text-white/50 uppercase mb-1.5">Crop Mode</label>
        <select value={transforms.crop} onChange={e => setTransforms(t => ({...t, crop: e.target.value}))}
          className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-indigo-500/80 transition-all">
          <option value="scale">Scale</option>
          <option value="fit">Fit</option>
          <option value="fill">Fill</option>
          <option value="crop">Crop</option>
          <option value="pad">Pad</option>
        </select>
      </div>

      <div>
        <div className="flex justify-between items-center mb-1.5">
          <label className="block text-[10px] text-white/50 uppercase">Blur</label>
          <span className="text-[10px] text-white/40">{transforms.blur}</span>
        </div>
        <input type="range" min="0" max="2000" value={transforms.blur} onChange={e => setTransforms(t => ({...t, blur: e.target.value}))}
          className="w-full accent-indigo-500" />
      </div>

      <button onClick={() => setTransforms({ width: '', height: '', crop: 'scale', blur: 0, format: transforms.format })}
        className="w-full py-2 text-xs font-semibold text-white/40 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all">
        Reset Transforms
      </button>
    </div>
  );
}

function FormatPicker({ asset, transforms, setTransforms }) {
  const isImage = asset.resource_type === 'image';
  const isVideo = asset.resource_type === 'video';
  const formats = isImage ? IMAGE_FORMATS : isVideo ? VIDEO_FORMATS : null;

  if (!formats) return null;

  return (
    <div className="space-y-3">
      <div className="text-[11px] font-bold text-indigo-300 uppercase tracking-widest">
        {isImage ? 'Export Format' : 'Video Format'}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {formats.map(fmt => (
          <button key={fmt.id} onClick={() => setTransforms(t => ({...t, format: fmt.id}))}
            className={`flex items-start gap-2 p-3 rounded-xl border text-left transition-all duration-300
              ${transforms.format === fmt.id
                ? 'border-indigo-500/50 bg-indigo-500/10 shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                : 'border-white/5 bg-black/20 hover:border-white/10 hover:bg-white/5'}`}>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md mt-0.5 flex-shrink-0 uppercase shadow-inner ${badgeColors[fmt.badge] || 'bg-white/10 text-white/40'}`}>
              {fmt.badge}
            </span>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-white/90 leading-none mb-1">{fmt.label}</div>
              <div className="text-[10px] text-indigo-300/50 leading-tight">{fmt.desc}</div>
            </div>
          </button>
        ))}
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

  const [transforms, setTransforms] = useState({
    width: '',
    height: '',
    crop: 'scale',
    blur: 0,
    format: asset?.resource_type === 'image' ? 'webp' : 'original'
  });

  if (!asset) return null;

  const isImage = asset.resource_type === 'image';
  const isVideo = asset.resource_type === 'video';
  const name    = asset.public_id.split('/').pop();

  const transformedUrl = useMemo(() => getTransformedUrl(asset, transforms), [asset, transforms]);

  const copyUrl = () => {
    navigator.clipboard.writeText(transformedUrl);
    toast('URL copied!', 'success');
  };

  const downloadAs = () => {
    const a = document.createElement('a');
    a.href = transformedUrl;
    a.download = name;
    a.target = '_blank';
    a.rel = 'noreferrer';
    a.click();
    toast(`Downloading…`, 'info');
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

  const inputClass = "w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-indigo-500/80 transition-all shadow-inner";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 animate-fade-in" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(16px)' }} onClick={onClose}>
      <div className="rounded-3xl w-full max-w-6xl max-h-full overflow-hidden shadow-2xl border border-white/10 glass-panel flex flex-col"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center gap-4 px-8 py-5 border-b border-white/10 bg-black/20">
          <h2 className="font-bold text-white text-lg flex-1 truncate tracking-wide">{name}</h2>
          <span className="text-xs font-mono font-bold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-lg shadow-inner">{asset.format?.toUpperCase()}</span>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors text-2xl leading-none">&times;</button>
        </div>

        <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-y-auto lg:overflow-hidden">
          
          {/* Left Column: Preview & URL */}
          <div className="flex-1 p-8 flex flex-col gap-6 lg:overflow-y-auto bg-black/20 border-r border-white/5">
            {/* Preview container */}
            <div className="rounded-2xl overflow-hidden flex items-center justify-center min-h-[300px] flex-1 bg-black/40 border border-white/5 shadow-inner relative group">
              {isImage && <img src={transformedUrl} alt="" className="max-w-full max-h-full object-contain drop-shadow-[0_0_20px_rgba(0,0,0,0.5)] transition-all duration-300" />}
              {isVideo && <video controls className="max-w-full max-h-full rounded-lg w-full drop-shadow-2xl"><source src={transformedUrl} /></video>}
              {!isImage && !isVideo && <div className="py-10 text-6xl opacity-40 drop-shadow-xl">📄</div>}
            </div>

            {/* Transformations Panel */}
            <TransformPanel asset={asset} transforms={transforms} setTransforms={setTransforms} />

            {/* URL Output */}
            <div className="flex gap-3">
              <input readOnly value={transformedUrl || ''} className="flex-1 bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-xs text-indigo-200/80 font-mono outline-none truncate shadow-inner" />
              <button onClick={copyUrl} className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-xl transition-all border border-white/10 whitespace-nowrap shadow-[0_0_15px_rgba(255,255,255,0.05)]">Copy URL</button>
              <button onClick={downloadAs} className="px-6 py-3 bg-indigo-500 hover:bg-indigo-400 text-white font-semibold rounded-xl transition-all whitespace-nowrap shadow-[0_0_15px_rgba(99,102,241,0.4)]">Download</button>
            </div>
          </div>

          {/* Right Column: Details & Edits */}
          <div className="w-full lg:w-[400px] p-8 space-y-8 lg:overflow-y-auto">
            
            {/* Details grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                ['Format', asset.format?.toUpperCase()],
                ['Size', formatBytes(asset.bytes)],
                ['Type', asset.resource_type],
                ['Dimensions', asset.width && asset.height ? `${asset.width} x ${asset.height}` : '—'],
                ['Created', asset.created_at ? new Date(asset.created_at).toLocaleDateString() : '—'],
              ].map(([k, v]) => (
                <div key={k} className="bg-black/30 border border-white/5 rounded-xl px-4 py-3 shadow-inner">
                  <div className="text-[10px] text-indigo-300/70 uppercase tracking-widest font-bold mb-1.5">{k}</div>
                  <div className="text-sm font-semibold text-white/90">{v || '—'}</div>
                </div>
              ))}
            </div>

            {/* Format Conversion */}
            <FormatPicker asset={asset} transforms={transforms} setTransforms={setTransforms} />

            {/* Tags */}
            <div className="bg-black/30 border border-white/5 rounded-2xl p-5 shadow-inner">
              <div className="text-[11px] font-bold text-indigo-300 uppercase tracking-widest mb-3">Tags</div>
              <div className="flex flex-wrap gap-2 mb-4">
                {tags.map(tag => (
                  <span key={tag} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/20 border border-indigo-500/30 rounded-lg text-xs font-semibold text-indigo-200 shadow-[0_0_10px_rgba(99,102,241,0.1)]">
                    {tag}
                    <button onClick={() => removeTag(tag)} className="text-indigo-300/50 hover:text-rose-400 transition-colors leading-none ml-1">✕</button>
                  </span>
                ))}
                {!tags.length && <span className="text-xs font-medium text-white/30 italic">No tags</span>}
              </div>
              <div className="flex gap-2">
                <input value={newTag} onChange={e => setNewTag(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addTag()}
                  placeholder="Add a tag..."
                  className={inputClass} />
                <button onClick={addTag} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-sm font-semibold rounded-xl transition-all border border-white/10 whitespace-nowrap">+ Add</button>
              </div>
            </div>

            {/* Rename */}
            <div className="bg-black/30 border border-white/5 rounded-2xl p-5 shadow-inner">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-widest">Rename Public ID</span>
                <button onClick={() => setRenaming(r => !r)} className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">{renaming ? 'Cancel' : '✏️ Edit'}</button>
              </div>
              {renaming && (
                <div className="flex gap-2 animate-fade-in">
                  <input value={newId} onChange={e => setNewId(e.target.value)} className={inputClass} />
                  <button onClick={doRename} className="px-5 py-2 bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-semibold rounded-xl transition-colors whitespace-nowrap shadow-[0_0_10px_rgba(99,102,241,0.3)]">Save</button>
                </div>
              )}
            </div>

            {/* Danger Zone */}
            <div className="pt-4 border-t border-white/10">
              <button onClick={() => { onDelete(asset); onClose(); }}
                className="w-full py-3 bg-gradient-to-r from-rose-500/10 to-red-600/10 hover:from-rose-500 hover:to-red-600 border border-rose-500/20 text-rose-400 hover:text-white text-sm font-bold uppercase tracking-wider rounded-xl transition-all shadow-[0_0_15px_rgba(244,63,94,0.1)] hover:shadow-[0_0_20px_rgba(244,63,94,0.4)]">
                🗑️ Delete Asset
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
