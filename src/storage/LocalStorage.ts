import type { Encounter } from '../types';
import { createEmptyEncounter } from '../types';
import type { EncounterStorage } from '../storage';

/**
 * LocalStorage-based storage implementation for local testing.
 * Uses browser localStorage to persist encounters.
 * Follows the same interface as Firebase so they can be swapped easily.
 */
export class LocalStorageStorage implements EncounterStorage {
  private prefix: string;
  
  constructor(prefix: string = 'draw-steel-encounter-') {
    this.prefix = prefix;
  }
  
  private getKey(id: string): string {
    return `${this.prefix}${id}`;
  }
  
  async get(id: string): Promise<Encounter | undefined> {
    try {
      const data = localStorage.getItem(this.getKey(id));
      if (!data) return undefined;
      return JSON.parse(data) as Encounter;
    } catch (error) {
      console.error('Error reading encounter:', error);
      return undefined;
    }
  }
  
  async save(encounter: Encounter): Promise<void> {
    try {
      localStorage.setItem(this.getKey(encounter.id), JSON.stringify(encounter));
    } catch (error) {
      console.error('Error saving encounter:', error);
      throw error;
    }
  }
  
  async delete(id: string): Promise<void> {
    localStorage.removeItem(this.getKey(id));
  }
  
  async create(id: string): Promise<Encounter> {
    const encounter = createEmptyEncounter(id);
    await this.save(encounter);
    return encounter;
  }
}

// Default instance - can be swapped to Firebase later
let storageInstance: EncounterStorage | null = null;

export const getStorage = (): EncounterStorage => {
  if (!storageInstance) {
    // Default to localStorage for browser testing
    // To swap to Firebase, import and use FirebaseStorage instead
    storageInstance = new LocalStorageStorage();
  }
  return storageInstance;
};

export const setStorage = (storage: EncounterStorage): void => {
  storageInstance = storage;
};