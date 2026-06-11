// src/context/AppContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

const AppContext = createContext(null);

// ── helpers ────────────────────────────────────────────────────
function makeId() {
  return 'p_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function emptyProfile(name = 'New Profile') {
  return { id: makeId(), name, cloudName: '', apiKey: '', apiSecret: '', uploadPreset: '', createdAt: Date.now() };
}

// ── provider ───────────────────────────────────────────────────
export function AppProvider({ children }) {
  const [user, setUser]                   = useState(null);
  const [profiles, setProfiles]           = useState([]);
  const [activeProfileId, setActiveProfileId] = useState(null);
  const [authStatus, setAuthStatus]       = useState('loading');
  const [toasts, setToasts]               = useState([]);

  // Derived: the currently active credential object
  const credentials = profiles.find(p => p.id === activeProfileId) || null;

  // ── persist to Firestore ────────────────────────────────────
  const persist = useCallback(async (uid, newProfiles, newActiveId) => {
    await setDoc(doc(db, 'credentials', uid), { profiles: newProfiles, activeProfileId: newActiveId });
    sessionStorage.setItem('cld_creds', JSON.stringify(newProfiles.find(p => p.id === newActiveId) || null));
  }, []);

  // ── auth listener ───────────────────────────────────────────
  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        try {
          const snap = await getDoc(doc(db, 'credentials', u.uid));
          if (snap.exists()) {
            const data = snap.data();

            // ── migrate old single-credential format ──────────
            if (!data.profiles) {
              // Old format: { cloudName, apiKey, apiSecret, uploadPreset }
              const migrated = [{ ...emptyProfile('Default'), ...data, id: makeId() }];
              const aid = migrated[0].id;
              await persist(u.uid, migrated, aid);
              setProfiles(migrated);
              setActiveProfileId(aid);
              sessionStorage.setItem('cld_creds', JSON.stringify(migrated[0]));
              setAuthStatus('app');
            } else {
              setProfiles(data.profiles || []);
              setActiveProfileId(data.activeProfileId || data.profiles?.[0]?.id || null);
              const active = (data.profiles || []).find(p => p.id === (data.activeProfileId || data.profiles?.[0]?.id));
              sessionStorage.setItem('cld_creds', JSON.stringify(active || null));
              setAuthStatus(data.profiles?.length ? 'app' : 'setup');
            }
          } else {
            setAuthStatus('setup');
          }
        } catch {
          setAuthStatus('setup');
        }
      } else {
        setUser(null);
        setProfiles([]);
        setActiveProfileId(null);
        sessionStorage.removeItem('cld_creds');
        setAuthStatus('auth');
      }
    });
  }, []);

  // ── profile actions ─────────────────────────────────────────
  const switchProfile = useCallback(async (id) => {
    setActiveProfileId(id);
    const active = profiles.find(p => p.id === id);
    sessionStorage.setItem('cld_creds', JSON.stringify(active || null));
    if (user) await setDoc(doc(db, 'credentials', user.uid), { profiles, activeProfileId: id });
  }, [profiles, user]);

  const saveProfile = useCallback(async (profile) => {
    // upsert by id
    const exists = profiles.some(p => p.id === profile.id);
    const newProfiles = exists
      ? profiles.map(p => p.id === profile.id ? profile : p)
      : [...profiles, profile];
    setProfiles(newProfiles);
    const aid = activeProfileId || profile.id;
    setActiveProfileId(aid);
    await persist(user.uid, newProfiles, aid);
  }, [profiles, activeProfileId, user, persist]);

  const deleteProfile = useCallback(async (id) => {
    const newProfiles = profiles.filter(p => p.id !== id);
    const newActiveId = id === activeProfileId
      ? (newProfiles[0]?.id || null)
      : activeProfileId;
    setProfiles(newProfiles);
    setActiveProfileId(newActiveId);
    const active = newProfiles.find(p => p.id === newActiveId);
    sessionStorage.setItem('cld_creds', JSON.stringify(active || null));
    await persist(user.uid, newProfiles, newActiveId);
    if (newProfiles.length === 0) setAuthStatus('setup');
  }, [profiles, activeProfileId, user, persist]);

  const addBlankProfile = useCallback(() => emptyProfile(), []);

  // ── toast ──────────────────────────────────────────────────
  const toast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);

  const logout = () => signOut(auth);

  return (
    <AppContext.Provider value={{
      user, credentials, profiles, activeProfileId,
      authStatus, setAuthStatus,
      switchProfile, saveProfile, deleteProfile, addBlankProfile,
      toast, toasts, logout,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
