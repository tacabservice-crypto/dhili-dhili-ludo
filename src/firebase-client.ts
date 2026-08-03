// src/firebase-client.ts
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getAnalytics, isSupported } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyAWJyBQKaL83HTd5nLirtejA3wNaUhia9k',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'dhilidhili.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'dhilidhili',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'dhilidhili.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '760096560567',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:760096560567:web:f6e1f923ab1afab2470432',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-4XDTHBHT86'
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);

export let analytics: ReturnType<typeof getAnalytics> | null = null;

if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {
    analytics = null;
  });
}
