import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  get,
  getDatabase,
  onValue,
  ref,
  remove,
  set,
  type Unsubscribe,
} from 'firebase/database';
import type { Encounter } from './types';

interface FirebaseEncounterRecord {
  lastModified: number;
  data: Encounter;
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const hasFirebaseConfig = Object.values(firebaseConfig).every(Boolean);

const getDatabaseInstance = () => {
  if (!hasFirebaseConfig) {
    return null;
  }

  try {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    return getDatabase(app);
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
    return null;
  }
};

const db = getDatabaseInstance();

const isEncounterRecord = (value: unknown): value is FirebaseEncounterRecord => {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<FirebaseEncounterRecord>;
  return !!candidate.data && typeof candidate.data === 'object';
};

const getEncounterPath = (encounterId: string) => `encounters/${encounterId}`;

export const isFirebaseEnabled = (): boolean => db !== null;

export const fetchEncounterFromFirebase = async (encounterId: string): Promise<Encounter | undefined> => {
  if (!db) return undefined;

  const snapshot = await get(ref(db, getEncounterPath(encounterId)));
  const value = snapshot.val();
  if (!isEncounterRecord(value)) return undefined;
  return value.data;
};

export const saveEncounterToFirebase = async (encounter: Encounter): Promise<void> => {
  if (!db) return;

  const payload: FirebaseEncounterRecord = {
    lastModified: Date.now(),
    data: encounter,
  };

  await set(ref(db, getEncounterPath(encounter.id)), payload);
};

export const deleteEncounterFromFirebase = async (encounterId: string): Promise<void> => {
  if (!db) return;
  await remove(ref(db, getEncounterPath(encounterId)));
};

export const subscribeToEncounter = (
  encounterId: string,
  onEncounter: (encounter: Encounter) => void,
  onError?: (error: Error) => void,
): Unsubscribe => {
  if (!db) return () => undefined;

  const encounterRef = ref(db, getEncounterPath(encounterId));
  return onValue(
    encounterRef,
    (snapshot) => {
      const value = snapshot.val();
      if (!isEncounterRecord(value)) return;
      onEncounter(value.data);
    },
    (error) => {
      onError?.(error);
    },
  );
};

export const subscribeToConnection = (onStateChange: (connected: boolean) => void): Unsubscribe => {
  if (!db) return () => undefined;

  return onValue(ref(db, '.info/connected'), (snapshot) => {
    onStateChange(Boolean(snapshot.val()));
  });
};
