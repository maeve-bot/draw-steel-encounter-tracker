import type { Encounter } from './types';

/**
 * Storage interface - implement this to add new storage backends
 * (Firebase, Supabase, localStorage, etc.)
 */
export interface EncounterStorage {
  /**
   * Get an encounter by ID. Returns undefined if not found.
   */
  get(id: string): Promise<Encounter | undefined>;
  
  /**
   * Save an encounter. Creates if doesn't exist, updates if it does.
   */
  save(encounter: Encounter): Promise<void>;
  
  /**
   * Delete an encounter by ID.
   */
  delete(id: string): Promise<void>;
  
  /**
   * Create a new encounter with a generated ID.
   * Returns the new encounter with its ID set.
   */
  create(id: string): Promise<Encounter>;
}

// Generate a 12-character random alphanumeric ID
export const generateId = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};