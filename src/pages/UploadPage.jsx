// src/pages/UploadPage.jsx
import { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { uploadFile, formatBytes } from '../lib/cloudinary';

function fileIcon(type) {
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
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef();

  const enqueue = (files) => {
    const items = Array.from(files).map(file => ({
      id: Date.now() + Math.random(),
      file,
      status: 'pending', // pending | uploading | done | error
      progress: 0,
      error: '',
    }));
    setQueue(q => [...items, ...q]);
    items.forEach(item => startUpload(item));
  };

  const startUpload = async (item) => {
    setQueue(q => q.map(x => x.id === item.id ? { ...x, status: 'uploading', progress: 30 } : x));
    try {
      await uploadFile(item.file, credentials, folder || undefined);
      setQueue(q => q.map(x => x.id === item.id ? { ...x, status: 'done', progress: 100 } : x));
      toast(`Uploaded: ${item.file.name}`, 'success');
    } catch (e) {
      setQueue(q => q.map(x => x.id === item.id ? { ...x, status: 'error', progress: 0, error: e.message } : x));
      toast(`Upload failed: ${item.file.name}`, 'error');
    }
  };

  const onDrop = (e) => { e.preventDefault(); setDragging(false); enqueue(e.dataTransfer.files); };

  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-3xl mx-auto w-full">
      <h1 className="text-xl font-bold text-white mb-6">Upload Files</h1>

      {/* Drop zone */}
      <div
        onClick={() => inputRef.current.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`rounded-2xl border-2 border-dashed p-14 text-center cursor-pointer transition-all mb-6
          ${dragging ? 'border-blue-500 bg-blue-500/10' : 'border-slate-700 hover:border-slate-500 hover:bg-slate-800/30'}`}>
        <div className="text-5xl mb-4">📤</div>
        <h3 className="text-base font-semibold text-white mb-2">Drop files here or click to browse</h3>
        <p className="text-sm text-slate-400">Images, videos, PDFs and more — up to 100 MB</p>
        <input ref={inputRef} type="file" multiple className="hidden" onChange={e => enqueue(e.target.files)} />
      </div>

      {/* Folder */}
      <div className="mb-6">
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Folder (optional)</label>
        <input value={folder} onChange={e => setFolder(e.target.value)}
          placeholder="e.g. portfolio/2024"
          className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-blue-500 transition-colors" />
      </div>

      {/* Queue */}
      {queue.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-white">{queue.length} file{queue.length !== 1 ? 's' : ''}</h2>
            <button onClick={() => setQueue([])} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">Clear all</button>
          </div>
          {queue.map(item => (
            <div key={item.id} className="flex items-center gap-4 bg-[#111520] border border-slate-800 rounded-xl p-4">
              <span className="text-2xl flex-shrink-0">{fileIcon(item.file.type)}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">{item.file.name}</div>
                <div className="text-xs text-slate-500 mb-2">{formatBytes(item.file.size)}</div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500
                    ${item.status === 'done'  ? 'bg-emerald-500' : ''}
                    ${item.status === 'error' ? 'bg-red-500' : ''}
                    ${item.status === 'uploading' ? 'bg-gradient-to-r from-blue-500 to-violet-500 animate-pulse' : ''}
                    ${item.status === 'pending' ? 'bg-slate-600' : ''}`}
                    style={{ width: item.status === 'pending' ? '5%' : `${item.progress}%` }} />
                </div>
              </div>
              <div className="text-xs flex-shrink-0 font-medium">
                {item.status === 'done'  && <span className="text-emerald-400">✅ Done</span>}
                {item.status === 'error' && <span className="text-red-400">❌ Failed</span>}
                {item.status === 'uploading' && <span className="text-blue-400">Uploading…</span>}
                {item.status === 'pending'   && <span className="text-slate-500">Waiting…</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
