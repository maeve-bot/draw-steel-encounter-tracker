import type { Encounter } from './types';
import type { EncounterStorage, SyncStatus } from './storage';
import {
  deleteEncounterFromFirebase,
  fetchEncounterFromFirebase,
  isFirebaseEnabled,
  saveEncounterToFirebase,
  subscribeToConnection,
  subscribeToEncounter,
} from './firebase';
import { LocalStorageStorage } from './storage/LocalStorage';

export class SyncStorage implements EncounterStorage {
  private localStorage: LocalStorageStorage;
  private status: SyncStatus;
  private statusListeners: Set<(status: SyncStatus) => void>;

  constructor() {
    this.localStorage = new LocalStorageStorage();
    this.status = isFirebaseEnabled() ? 'offline' : 'local';
    this.statusListeners = new Set();

    if (isFirebaseEnabled()) {
      subscribeToConnection((connected) => {
        this.setStatus(connected ? 'connected' : 'offline');
      });
    }
  }

  async get(id: string): Promise<Encounter | undefined> {
    const local = await this.localStorage.get(id);

    if (!isFirebaseEnabled()) {
      return local;
    }

    try {
      const remote = await fetchEncounterFromFirebase(id);
      if (remote) {
        await this.localStorage.save(remote);
        return remote;
      }
    } catch (error) {
      console.error('Failed to fetch encounter from Firebase:', error);
      this.setStatus('offline');
    }

    return local;
  }

  async save(encounter: Encounter): Promise<void> {
    await this.localStorage.save(encounter);

    if (!isFirebaseEnabled()) {
      return;
    }

    try {
      await saveEncounterToFirebase(encounter);
    } catch (error) {
      console.error('Failed to save encounter to Firebase:', error);
      this.setStatus('offline');
    }
  }

  async delete(id: string): Promise<void> {
    await this.localStorage.delete(id);

    if (!isFirebaseEnabled()) {
      return;
    }

    try {
      await deleteEncounterFromFirebase(id);
    } catch (error) {
      console.error('Failed to delete encounter in Firebase:', error);
      this.setStatus('offline');
    }
  }

  async create(id: string): Promise<Encounter> {
    const encounter = await this.localStorage.create(id);
    await this.save(encounter);
    return encounter;
  }

  subscribe(id: string, onEncounter: (encounter: Encounter) => void): () => void {
    if (!isFirebaseEnabled()) {
      return () => undefined;
    }

    return subscribeToEncounter(
      id,
      async (remoteEncounter) => {
        await this.localStorage.save(remoteEncounter);
        onEncounter(remoteEncounter);
      },
      (error) => {
        console.error('Realtime sync subscription error:', error);
        this.setStatus('offline');
      },
    );
  }

  getSyncStatus(): SyncStatus {
    return this.status;
  }

  onSyncStatusChange(callback: (status: SyncStatus) => void): () => void {
    this.statusListeners.add(callback);
    callback(this.status);
    return () => {
      this.statusListeners.delete(callback);
    };
  }

  private setStatus(status: SyncStatus): void {
    if (this.status === status) {
      return;
    }

    this.status = status;
    for (const listener of this.statusListeners) {
      listener(status);
    }
  }
}

let storageInstance: EncounterStorage | null = null;

export const getStorage = (): EncounterStorage => {
  if (!storageInstance) {
    storageInstance = new SyncStorage();
  }
  return storageInstance;
};

export const setStorage = (storage: EncounterStorage): void => {
  storageInstance = storage;
};
