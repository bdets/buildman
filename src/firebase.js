import { initializeApp, getApps } from "firebase/app";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";

const FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Build-time fallback only. The REAL, live org info (what Settings edits)
// lives in Firestore at config/org — see src/org-store.js, which merges
// this default under whatever's saved there. Nothing in the UI should read
// this constant directly anymore; it only exists for org-store.js and for
// the very first paint before that Firestore read resolves.
export const DEFAULT_ORG = {
  name: import.meta.env.VITE_ORG_NAME || "Society",
  tagline: import.meta.env.VITE_ORG_TAGLINE || "",
  address: import.meta.env.VITE_ORG_ADDRESS || "",
  currency: import.meta.env.VITE_ORG_CURRENCY || "৳",
  logoDataUrl: null, // set from Settings — see src/modules/settings.js
};

// ---- primary app: the signed-in user's real session ----
export const app = initializeApp(FIREBASE_CONFIG);
export const auth = getAuth(app);

// Offline-first: Firestore keeps a local IndexedDB cache of every document
// this user has ever queried (which, thanks to firestore.rules, is already
// scoped to *only* the data their role is allowed to see — so the cache is
// naturally "selective," per-role, with zero custom sync code needed).
// persistentMultipleTabManager lets the cache be shared safely if the person
// has the app open in more than one browser tab.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});

// ---- secondary app: used ONLY to create a new login (director/admin
// creating a member/admin account) without disturbing the primary app's
// signed-in session. Firebase's client SDK has no "create another user
// without affecting my own session" call — this isolated second App
// instance is the standard client-only workaround (no Cloud Function,
// no Blaze plan needed). ----
function getSecondaryApp() {
  const existing = getApps().find((a) => a.name === "Secondary");
  return existing || initializeApp(FIREBASE_CONFIG, "Secondary");
}
export const secondaryAuth = getAuth(getSecondaryApp());
