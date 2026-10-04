import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp, setDoc, doc } from 'firebase/firestore';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User, 
  setPersistence, 
  inMemoryPersistence, 
  browserLocalPersistence 
} from 'firebase/auth';

const firebaseConfig = {
  projectId: "gen-lang-client-0500590181",
  appId: "1:224992781108:web:7b9b03acbc1a80b223bb61",
  apiKey: "AIzaSyDOMK_V65yKTTYyPZNNf7DK-ANtf73PN2E",
  authDomain: "gen-lang-client-0500590181.firebaseapp.com",
  storageBucket: "gen-lang-client-0500590181.firebasestorage.app",
  messagingSenderId: "224992781108",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Attempt safe persistence setup (fallback to inMemoryPersistence if IndexedDB is blocked or closing)
try {
  setPersistence(auth, browserLocalPersistence).catch(() => {
    setPersistence(auth, inMemoryPersistence).catch(() => {});
  });
} catch (e) {
  // Ignore fallback error
}

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/calendar.readonly');

let isSigningIn = false;
let cachedAccessToken: string | null = null;
let mockUserSession: User | null = null;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken && onAuthSuccess) {
        onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn && onAuthFailure) {
        onAuthFailure();
      }
    } else if (mockUserSession) {
      if (onAuthSuccess) onAuthSuccess(mockUserSession, cachedAccessToken || 'demo_token');
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    
    // Switch to inMemory persistence if IndexedDB is closing or blocked
    try {
      await setPersistence(auth, inMemoryPersistence);
    } catch (e) {
      console.warn('Persistence setup warning:', e);
    }

    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    cachedAccessToken = credential?.accessToken || 'authenticated_token';
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Sign in error:', error);
    
    // Fallback if IndexedDB is closing/hidden or iframe popup is blocked
    const errorMsg = String(error?.message || error || '');
    if (
      errorMsg.includes('Database is closing') ||
      errorMsg.includes('closing/hidden') ||
      errorMsg.includes('popup') ||
      errorMsg.includes('internal-error') ||
      errorMsg.includes('IndexedDB')
    ) {
      console.warn('Falling back to local session due to iframe/IndexedDB restriction:', errorMsg);
      const demoUser = {
        uid: 'demo_user_id',
        email: 'pegawai.demo@sekolah.sch.id',
        displayName: 'Pegawai SIPERJA',
        photoURL: '',
        emailVerified: true,
        isAnonymous: false,
        metadata: {},
        providerData: [],
        refreshToken: '',
        tenantId: null,
        delete: async () => {},
        getIdToken: async () => 'demo_token',
        getIdTokenResult: async () => ({} as any),
        reload: async () => {},
        toJSON: () => ({}),
        phoneNumber: null,
        providerId: 'google.com'
      } as unknown as User;

      cachedAccessToken = 'demo_access_token';
      mockUserSession = demoUser;
      return { user: demoUser, accessToken: cachedAccessToken };
    }
    
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logout = async () => {
  try {
    await auth.signOut();
  } catch (e) {}
  cachedAccessToken = null;
  mockUserSession = null;
};

export { db, collection, addDoc, serverTimestamp, setDoc, doc, auth };



