import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

const runtimeHost = typeof window !== 'undefined' ? window.location.hostname : null;
const runtimeAuthDomain =
  import.meta.env.VITE_FIREBASE_AUTH_DOMAIN?.trim() ||
  (runtimeHost && runtimeHost !== 'localhost' && runtimeHost !== '127.0.0.1' ? runtimeHost : firebaseConfig.authDomain);

const finalConfig = {
  ...firebaseConfig,
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfig.apiKey,
  authDomain: runtimeAuthDomain
};

const app = initializeApp(finalConfig);
export const db = getFirestore(app, finalConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Validate Connection to Firestore
async function testConnection() {
  try {
    // Try to fetch a non-existent doc to test connectivity
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firebase connection test successful.");
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. The client is offline.");
    }
    // Skip logging for other errors, as this is simply a connection test.
  }
}
testConnection();
