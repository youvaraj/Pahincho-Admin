import { getApps, initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Client SDK is used ONLY for the Google sign-in handshake — no Firestore
// reads happen from the browser. These values are public app identifiers
// (not secrets), matching the RN app's pahincho-1a4d6 project config.
const firebaseConfig = {
  apiKey: "AIzaSyDiwCKr21T0UpYRvkm-Agk_zRhBZFgs0E8",
  authDomain: "pahincho-1a4d6.firebaseapp.com",
  projectId: "pahincho-1a4d6",
  storageBucket: "pahincho-1a4d6.appspot.com",
  messagingSenderId: "32316662552",
  appId: "1:32316662552:web:d6d5d57cde7fbb4b2eb46d",
};

const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);

export const clientAuth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
