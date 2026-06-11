// src/pages/UploadPage.jsx
import { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { uploadFile, formatBytes, fetchFolders } from '../lib/cloudinary';

function fileIcon(type) {
  if (!type) return '🔗'; // For URL uploads
  if (type.startsWith('image/')) return '🏞️';
  if (type.startsWith('video/')) return '🎬';
  if (type.startsWith('audio/')) return '🎵';
  if (type === 'application/pdf') return '📑';
  return '📄';
}

export default function UploadPage() {
  const { credentials, toast } = useApp();
  const [queue, setQueue]     = useState([]);
  const [folder, setFolder]   = useState('');
  const [folders, setFolders] = useState([]);
  const [urlInput, setUrlInput] = useState('');
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef();

  useEffect(() => {
    fetchFolders().then(data => setFolders(data.folders || [])).catch(() => {});
  }, []);

  const enqueue = (files) => {
    const items = Array.from(files).map(file => ({
      id: Date.now() + Math.random(),
      file,
      name: file.name,
      status: 'pending', // pending | uploading | done | error
      progress: 0,
      error: '',
    }));
    setQueue(q => [...items, ...q]);
    items.forEach(item => startUpload(item));
  };

  const enqueueUrl = () => {
    if (!urlInput.trim()) return;
    const url = urlInput.trim();
    const item = {
      id: Date.now() + Math.random(),
      file: url,
      name: url.substring(0, 50) + (url.length > 50 ? '...' : ''),
      isUrl: true,
      status: 'pending',
      progress: 0,
      error: '',
    };
    setQueue(q => [item, ...q]);
    setUrlInput('');
    startUpload(item);
  };

  const startUpload = async (item) => {
    setQueue(q => q.map(x => x.id === item.id ? { ...x, status: 'uploading', progress: 30 } : x));
    try {
      await uploadFile(item.file, credentials, folder || undefined);
      setQueue(q => q.map(x => x.id === item.id ? { ...x, status: 'done', progress: 100 } : x));
      toast(`Uploaded: ${item.name}`, 'success');
    } catch (e) {
      setQueue(q => q.map(x => x.id === item.id ? { ...x, status: 'error', progress: 0, error: e.message } : x));
      toast(`Upload failed: ${item.name}`, 'error');
    }
  };

  const onDrop = (e) => { e.preventDefault(); setDragging(false); enqueue(e.dataTransfer.files); };

  return (
    <div className="flex-1 overflow-y-auto p-8 w-full relative">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-white tracking-wide">Upload Assets</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: Upload Controls */}
          <div className="space-y-6">
            
            {/* Folder Selection */}
            <div className="glass-panel p-5 rounded-2xl">
              <label className="block text-[11px] font-bold text-indigo-300 uppercase tracking-widest mb-3">Target Folder</label>
              <div className="relative group">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">📂</span>
                <input value={folder} onChange={e => setFolder(e.target.value)}
                  list="cloudinary-folders"
                  placeholder="Root folder (or type a new folder name)"
                  className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-3 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-indigo-500/80 focus:bg-black/60 transition-all shadow-inner" />
                <datalist id="cloudinary-folders">
                  {folders.map(f => <option key={f.path} value={f.path} />)}
                </datalist>
              </div>
            </div>

            {/* URL Upload */}
            <div className="glass-panel p-5 rounded-2xl">
              <label className="block text-[11px] font-bold text-indigo-300 uppercase tracking-widest mb-3">Upload from Web</label>
              <div className="flex gap-2">
                <div className="relative flex-1 group">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">🔗</span>
                  <input value={urlInput} onChange={e => setUrlInput(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-3 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-indigo-500/80 focus:bg-black/60 transition-all shadow-inner" />
                </div>
                <button onClick={enqueueUrl} disabled={!urlInput.trim()}
                  className="px-5 bg-indigo-500 hover:bg-indigo-400 text-white font-semibold rounded-xl transition-all shadow-[0_0_15px_rgba(99,102,241,0.4)] disabled:opacity-50 disabled:shadow-none">
                  Fetch
                </button>
              </div>
            </div>

            {/* Drop zone */}
            <div
              onClick={() => inputRef.current.click()}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              className={`rounded-2xl border-2 border-dashed p-12 text-center cursor-pointer transition-all duration-300 glass-panel
                ${dragging ? 'border-indigo-500 bg-indigo-500/20 shadow-[0_0_30px_rgba(99,102,241,0.3)]' : 'border-white/20 hover:border-indigo-400/50 hover:bg-white/5'}`}>
              <div className={`text-6xl mb-6 transition-transform duration-300 ${dragging ? 'scale-110 drop-shadow-[0_0_15px_rgba(99,102,241,0.8)]' : ''}`}>📤</div>
              <h3 className="text-lg font-bold text-white mb-2 tracking-wide">Select files to upload</h3>
              <p className="text-xs text-white/40 font-medium">Drag and drop images, videos, or raw files here.</p>
              <input ref={inputRef} type="file" multiple className="hidden" onChange={e => enqueue(e.target.files)} />
            </div>

          </div>

          {/* Right Column: Queue */}
          <div className="glass-panel p-5 rounded-2xl flex flex-col h-[500px]">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
              <h2 className="text-[11px] font-bold text-indigo-300 uppercase tracking-widest">Upload Queue ({queue.length})</h2>
              {queue.length > 0 && <button onClick={() => setQueue([])} className="text-xs font-semibold text-white/30 hover:text-white transition-colors">Clear all</button>}
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {queue.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-white/20">
                  <span className="text-4xl mb-3 opacity-50">📋</span>
                  <span className="text-sm font-medium">Queue is empty</span>
                </div>
              )}
              {queue.map(item => (
                <div key={item.id} className="flex items-center gap-4 bg-black/40 border border-white/5 rounded-xl p-4 transition-all hover:bg-white/5 animate-fade-in">
                  <span className="text-2xl flex-shrink-0 drop-shadow-md">{fileIcon(item.isUrl ? null : item.file.type)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white/90 truncate tracking-wide">{item.name}</div>
                    <div className="text-[10px] text-white/40 font-mono mb-2">{item.isUrl ? 'URL' : formatBytes(item.file.size)}</div>
                    <div className="h-1.5 bg-black/50 rounded-full overflow-hidden shadow-inner border border-white/5">
                      <div className={`h-full rounded-full transition-all duration-500
                        ${item.status === 'done'  ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]' : ''}
                        ${item.status === 'error' ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.8)]' : ''}
                        ${item.status === 'uploading' ? 'bg-gradient-to-r from-indigo-500 to-fuchsia-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]' : ''}
                        ${item.status === 'pending' ? 'bg-white/20' : ''}`}
                        style={{ width: item.status === 'pending' ? '5%' : `${item.progress}%` }} />
                    </div>
                  </div>
                  <div className="text-[10px] flex-shrink-0 font-bold uppercase tracking-wider">
                    {item.status === 'done'  && <span className="text-emerald-400">Done</span>}
                    {item.status === 'error' && <span className="text-rose-400">Failed</span>}
                    {item.status === 'uploading' && <span className="text-indigo-400 animate-pulse">Uploading</span>}
                    {item.status === 'pending'   && <span className="text-white/30">Waiting</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
