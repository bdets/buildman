// ============================================================
//  EDIT THIS FILE PER ORGANIZATION. Paste your Firebase SDK
//  config here (Firebase Console → Project settings → General
//  → Your apps → SDK setup). These values identify your project
//  to Google's servers — they are NOT secret; real security comes
//  from firestore.rules + Firebase Auth, not from hiding this file.
//  That's why it's fine to commit this directly to GitHub, unlike
//  a real secret (a database password, a private API key, etc).
// ============================================================

export const firebaseConfig = {
  apiKey: "AIzaSyCNYRKG1ElOd-jdCZulceKSKbbaqLp1Mpc",
  authDomain: "buildmanage1.firebaseapp.com",
  projectId: "buildmanage1",
  storageBucket: "buildmanage1.firebasestorage.app",
  messagingSenderId: "791138654012",
  appId: "1:791138654012:web:d37fab52c3ab58b1a53039"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Default org info shown before Settings has ever been saved (Settings,
// once used, overrides this from Firestore — see src/org-store.js).
export const DEFAULT_ORG = {
  name: "Darul Barakah",
  tagline: "House of Blessings",
  address: "Holding: 3912, Road: 03, Ward: 02, Mozaffar Nagar Housing Society, Jalalabad, Bayzid, Chattogram.",
  currency: "৳",
  logoDataUrl: null,
};
