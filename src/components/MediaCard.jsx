// src/components/MediaCard.jsx
import { formatBytes, thumbUrl } from '../lib/cloudinary';

const resourceIcon = (r) => r === 'video' ? '🎬' : r === 'image' ? '🏞️' : '📄';

export default function MediaCard({ asset, selected, onSelect, onOpen, onDelete, viewMode }) {
  const thumb = thumbUrl(asset);
  const name  = asset.public_id.split('/').pop();
  const ext   = (asset.format || '').toUpperCase();

  if (viewMode === 'list') {
    return (
      <div className={`group flex items-center gap-3 px-4 py-3 rounded-xl border transition-all cursor-pointer
        ${selected
          ? 'border-blue-500/50 bg-blue-500/5'
          : 'border-white/[0.05] hover:border-white/[0.1] hover:bg-white/[0.02]'}`}
        onClick={() => onSelect(asset.public_id)}>
        {/* Checkbox */}
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all
          ${selected ? 'bg-blue-500 border-blue-500' : 'border-white/20 group-hover:border-white/40'}`}>
          {selected && <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>}
        </div>
        {/* Thumb */}
        <div className="w-14 h-10 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0 text-xl" style={{ background: '#111' }}>
          {thumb ? <img src={thumb} alt="" className="w-full h-full object-cover" loading="lazy" /> : <span className="opacity-40">{resourceIcon(asset.resource_type)}</span>}
        </div>
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-white/80 truncate">{name}</div>
          <div className="text-xs text-white/25 font-mono">{ext} · {formatBytes(asset.bytes)}</div>
        </div>
        {/* Actions */}
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={e => { e.stopPropagation(); onOpen(asset); }}
            className="px-3 py-1.5 text-xs rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-white/60 hover:text-white font-medium transition-all">View</button>
          <button onClick={e => { e.stopPropagation(); onDelete(asset); }}
            className="px-3 py-1.5 text-xs rounded-lg bg-red-500/8 hover:bg-red-500/15 text-red-400 font-medium transition-all">Delete</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`group relative rounded-xl border overflow-hidden transition-all cursor-pointer
      ${selected
        ? 'border-blue-500/60 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500/20'
        : 'border-white/[0.05] hover:border-white/[0.1] hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/60'}`}
      style={{ background: '#0c0c0c' }}
      onClick={() => onSelect(asset.public_id)}>
      {/* Thumbnail */}
      <div className="aspect-[4/3] flex items-center justify-center text-3xl overflow-hidden relative" style={{ background: '#111' }}>
        {thumb
          ? <img src={thumb} alt="" className="w-full h-full object-cover" loading="lazy" />
          : <span className="opacity-20">{resourceIcon(asset.resource_type)}</span>
        }
        {asset.resource_type === 'video' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm" style={{ background: 'rgba(0,0,0,0.7)' }}>▶</div>
          </div>
        )}
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
          <button onClick={e => { e.stopPropagation(); onOpen(asset); }}
            className="px-3 py-1.5 bg-white/90 text-black text-xs font-bold rounded-lg shadow-xl hover:bg-white transition-all scale-95 group-hover:scale-100">View</button>
          <button onClick={e => { e.stopPropagation(); onDelete(asset); }}
            className="px-3 py-1.5 bg-red-500 text-white text-xs font-bold rounded-lg shadow-xl hover:bg-red-400 transition-all scale-95 group-hover:scale-100">Del</button>
        </div>
      </div>
      {/* Select Checkbox */}
      <div className={`absolute top-2 left-2 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all
        ${selected ? 'bg-blue-500 border-blue-500 opacity-100' : 'border-white/50 opacity-0 group-hover:opacity-100 backdrop-blur-sm'}`}
        style={!selected ? { background: 'rgba(0,0,0,0.4)' } : {}}>
        {selected && <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>}
      </div>
      {/* Info */}
      <div className="p-2.5">
        <div className="text-xs font-medium text-white/70 truncate mb-0.5">{name}</div>
        <div className="text-[10px] text-white/25 font-mono">{ext} · {formatBytes(asset.bytes)}</div>
      </div>
    </div>
  );
}
