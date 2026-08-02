/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAWJyBQKaL83HTd5nLirtejA3wNaUhia9k",
  authDomain: "dhilidhili.firebaseapp.com",
  projectId: "dhilidhili",
  storageBucket: "dhilidhili.firebasestore.app",
  messagingSenderId: "760096560567",
  appId: "1:760096560567:web:f6e1f923ab1afab2470432",
  measurementId: "G-4XDTHBHT86"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export const db = getFirestore(app);
