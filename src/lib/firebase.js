// src/lib/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyCtvJfzxXioyJUnRsw8ePOP1OHy5OF5_VQ',
  authDomain: 'cloud-manger.firebaseapp.com',
  projectId: 'cloud-manger',
  storageBucket: 'cloud-manger.firebasestorage.app',
  messagingSenderId: '783199313979',
  appId: '1:783199313979:web:b801484de89327496c3c1e',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);
