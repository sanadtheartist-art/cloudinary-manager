// src/components/MediaCard.jsx
import { formatBytes, thumbUrl } from '../lib/cloudinary';

const resourceIcon = (r) => r === 'video' ? '🎬' : r === 'image' ? '🏞️' : '📄';

export default function MediaCard({ asset, selected, onSelect, onOpen, onDelete, viewMode }) {
  const thumb = thumbUrl(asset);
  const name  = asset.public_id.split('/').pop();
  const ext   = (asset.format || '').toUpperCase();

  if (viewMode === 'list') {
    return (
      <div className={`group flex items-center gap-4 px-5 py-3 rounded-2xl border transition-all duration-300 cursor-pointer
        ${selected
          ? 'border-indigo-500/50 bg-indigo-500/10 shadow-[0_0_20px_rgba(99,102,241,0.15)]'
          : 'border-white/[0.05] bg-white/[0.02] hover:border-white/[0.1] hover:bg-white/[0.04] hover:shadow-[0_4px_20px_rgba(0,0,0,0.5)]'}`}
        onClick={() => onSelect(asset.public_id)}>
        {/* Checkbox */}
        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300
          ${selected ? 'bg-indigo-500 border-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]' : 'border-white/20 group-hover:border-white/40'}`}>
          {selected && <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>}
        </div>
        {/* Thumb */}
        <div className="w-16 h-12 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0 text-xl bg-black/40 border border-white/5 shadow-inner">
          {thumb ? <img src={thumb} alt="" className="w-full h-full object-cover" loading="lazy" /> : <span className="opacity-40">{resourceIcon(asset.resource_type)}</span>}
        </div>
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-white/90 truncate tracking-wide">{name}</div>
          <div className="text-xs text-indigo-300/60 font-mono mt-0.5">{ext} <span className="opacity-50 mx-1">•</span> {formatBytes(asset.bytes)}</div>
        </div>
        {/* Actions */}
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
          <button onClick={e => { e.stopPropagation(); onOpen(asset); }}
            className="px-4 py-2 text-xs rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-all">View</button>
          <button onClick={e => { e.stopPropagation(); onDelete(asset); }}
            className="px-4 py-2 text-xs rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-semibold transition-all shadow-[0_0_10px_rgba(244,63,94,0)] hover:shadow-[0_0_15px_rgba(244,63,94,0.2)]">Delete</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`group relative rounded-2xl border overflow-hidden transition-all duration-300 cursor-pointer
      ${selected
        ? 'border-indigo-500/60 shadow-[0_0_25px_rgba(99,102,241,0.25)] ring-1 ring-indigo-500/30 -translate-y-1'
        : 'border-white/[0.05] hover:border-white/[0.15] hover:-translate-y-1 hover:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.8)]'}`}
      style={{ background: 'rgba(15,15,20,0.6)', backdropFilter: 'blur(12px)' }}
      onClick={() => onSelect(asset.public_id)}>
      {/* Thumbnail */}
      <div className="aspect-[4/3] flex items-center justify-center text-4xl overflow-hidden relative bg-black/40">
        {thumb
          ? <img src={thumb} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
          : <span className="opacity-20 group-hover:scale-110 transition-transform duration-500">{resourceIcon(asset.resource_type)}</span>
        }
        {asset.resource_type === 'video' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm bg-black/50 backdrop-blur-md border border-white/10 shadow-xl group-hover:scale-110 transition-transform">▶</div>
          </div>
        )}
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-all duration-300 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
          <button onClick={e => { e.stopPropagation(); onOpen(asset); }}
            className="px-4 py-2 bg-white/90 text-black text-xs font-bold rounded-xl shadow-xl hover:bg-white transition-all scale-90 group-hover:scale-100">View</button>
          <button onClick={e => { e.stopPropagation(); onDelete(asset); }}
            className="px-4 py-2 bg-rose-500 text-white text-xs font-bold rounded-xl shadow-xl hover:bg-rose-400 transition-all scale-90 group-hover:scale-100">Del</button>
        </div>
      </div>
      {/* Select Checkbox */}
      <div className={`absolute top-3 left-3 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-300 z-10
        ${selected ? 'bg-indigo-500 border-indigo-500 opacity-100 shadow-[0_0_15px_rgba(99,102,241,1)]' : 'border-white/50 opacity-0 group-hover:opacity-100 bg-black/20 backdrop-blur-md'}`}>
        {selected && <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>}
      </div>
      {/* Info */}
      <div className="p-3 border-t border-white/5">
        <div className="text-xs font-semibold text-white/80 truncate mb-1 tracking-wide">{name}</div>
        <div className="text-[10px] text-indigo-300/50 font-mono flex items-center justify-between">
          <span>{ext}</span>
          <span>{formatBytes(asset.bytes)}</span>
        </div>
      </div>
    </div>
  );
}
