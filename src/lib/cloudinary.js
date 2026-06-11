// src/lib/cloudinary.js
// All Cloudinary Admin API calls route through the local proxy server.

async function cldFetch(method, path, body = null) {
  const creds = JSON.parse(sessionStorage.getItem('cld_creds') || 'null');
  if (!creds) throw new Error('No Cloudinary credentials found. Please set them up first.');
  const { cloudName, apiKey, apiSecret } = creds;
  const authHeader = 'Basic ' + btoa(apiKey + ':' + apiSecret);

  // Always use the local Vite proxy to avoid CORS
  const url = `/cldapi/${cloudName}/${path}`;

  const opts = { method, headers: { Authorization: authHeader } };
  if (body) {
    opts.body = body;
    if (typeof body === 'string') opts.headers['Content-Type'] = 'application/json';
  }

  let res;
  try { res = await fetch(url, opts); }
  catch (e) { throw new Error('Network error or blocked by adblocker (' + e.message + ')'); }

  let json;
  try { json = await res.json(); }
  catch { throw new Error('Invalid response (HTTP ' + res.status + ')'); }

  if (json.error) throw new Error(json.error.message || 'Cloudinary error ' + res.status);
  return json;
}

export const cloudinaryAPI = cldFetch;

export async function fetchResources(type = 'image', cursor = null, maxResults = 40) {
  let path = `resources/${type}?max_results=${maxResults}`;
  if (cursor) path += `&next_cursor=${cursor}`;
  return cldFetch('GET', path);
}

export async function fetchFolders() {
  return cldFetch('GET', 'folders');
}

export async function fetchFolderContents(folderPath, type = 'image', cursor = null, maxResults = 40) {
  let path = `resources/${type}?prefix=${encodeURIComponent(folderPath)}&max_results=${maxResults}`;
  if (cursor) path += `&next_cursor=${cursor}`;
  return cldFetch('GET', path);
}

export async function searchResources(expression, cursor = null, maxResults = 40) {
  // Cloudinary advanced search endpoint
  let path = `resources/search`;
  const body = {
    expression: expression,
    max_results: maxResults,
    with_field: ['tags', 'context', 'image_metadata']
  };
  if (cursor) body.next_cursor = cursor;
  
  return cldFetch('POST', path, JSON.stringify(body));
}

export async function deleteResource(publicId, resourceType = 'image') {
  return cldFetch('DELETE', `resources/${resourceType}/upload?public_ids[]=${encodeURIComponent(publicId)}`);
}

export async function deleteResources(publicIds, resourceType = 'image') {
  const ids = publicIds.map(id => `public_ids[]=${encodeURIComponent(id)}`).join('&');
  return cldFetch('DELETE', `resources/${resourceType}/upload?${ids}`);
}

export async function uploadFile(file, { cloudName, apiKey, apiSecret, uploadPreset }, folder) {
  const url = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;
  const fd = new FormData();
  fd.append('file', file);

  if (uploadPreset) {
    fd.append('upload_preset', uploadPreset);
    if (folder) fd.append('folder', folder);
    const res = await fetch(url, { method: 'POST', body: fd });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Upload failed');
    return json;
  } else {
    const timestamp = Math.round(Date.now() / 1000);
    const paramsStr = folder ? `folder=${folder}&timestamp=${timestamp}` : `timestamp=${timestamp}`;
    const signature = await sha1Sign(paramsStr + apiSecret);
    fd.append('api_key', apiKey);
    fd.append('timestamp', timestamp);
    fd.append('signature', signature);
    if (folder) fd.append('folder', folder);
    const res = await fetch(url, { method: 'POST', body: fd });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Upload failed');
    return json;
  }
}

async function sha1Sign(message) {
  const enc = new TextEncoder();
  const hash = await crypto.subtle.digest('SHA-1', enc.encode(message));
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function formatBytes(bytes) {
  if (!bytes) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
  return (bytes / 1073741824).toFixed(2) + ' GB';
}

export function thumbUrl(asset) {
  if (asset.resource_type === 'image') {
    return asset.secure_url?.replace('/upload/', '/upload/c_fill,w_400,h_300,q_70/') || null;
  }
  return null;
}
