import { useState, useEffect, useCallback, useRef } from 'react';
import type { Encounter, Group } from '../types';
import { createEmptyEncounter } from '../types';
import { getStorage } from '../storage/index';

interface UseEncounterReturn {
  encounter: Encounter | null;
  loading: boolean;
  error: string | null;
  save: (encounter: Encounter) => Promise<void>;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  advanceRound: () => Promise<void>;
}

const MAX_HISTORY = 50;

export const useEncounter = (id: string): UseEncounterReturn => {
  const [encounter, setEncounter] = useState<Encounter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pastStates, setPastStates] = useState<Encounter[]>([]);
  const [futureStates, setFutureStates] = useState<Encounter[]>([]);
  const saveTimeoutRef = useRef<number | null>(null);

  // Load encounter on mount
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const storage = getStorage();
        const data = await storage.get(id);
        if (data) {
          setEncounter(data);
          // Clear history when loading new encounter
          setPastStates([]);
          setFutureStates([]);
        } else {
          // Create new encounter if doesn't exist
          const newEncounter = createEmptyEncounter(id);
          await storage.save(newEncounter);
          setEncounter(newEncounter);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load encounter');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (pastStates.length > 0) {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        if (futureStates.length > 0) {
          handleRedo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pastStates, futureStates]);

  const pushToHistory = useCallback((currentState: Encounter) => {
    setPastStates(prev => {
      const newHistory = [...prev, currentState];
      if (newHistory.length > MAX_HISTORY) {
        newHistory.shift();
      }
      return newHistory;
    });
    setFutureStates([]);
  }, []);

  const handleUndo = useCallback(() => {
    if (pastStates.length === 0 || !encounter) return;
    
    const previousState = pastStates[pastStates.length - 1];
    setPastStates(prev => prev.slice(0, -1));
    setFutureStates(prev => [encounter, ...prev]);
    setEncounter(previousState);
    
    // Save to database
    getStorage().save(previousState);
  }, [pastStates, encounter]);

  const handleRedo = useCallback(() => {
    if (futureStates.length === 0) return;
    
    const nextState = futureStates[0];
    setFutureStates(prev => prev.slice(1));
    setPastStates(prev => [...prev, encounter!]);
    setEncounter(nextState);
    
    // Save to database
    getStorage().save(nextState);
  }, [futureStates, encounter]);

  const save = useCallback(async (encounterToSave: Encounter) => {
    if (!encounter) return;
    
    pushToHistory(encounter);
    setEncounter(encounterToSave);
    
    // Debounced save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = window.setTimeout(() => {
      getStorage().save(encounterToSave);
    }, 500);
  }, [encounter, pushToHistory]);

  const advanceRound = useCallback(async () => {
    if (!encounter) return;
    
    pushToHistory(encounter);
    
    const updated: Encounter = {
      ...encounter,
      currentRound: encounter.currentRound + 1,
      groups: encounter.groups.map((group: Group) => ({
        ...group,
        hasActed: false,
      })),
    };
    
    setEncounter(updated);
    await getStorage().save(updated);
  }, [encounter, pushToHistory]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    encounter,
    loading,
    error,
    save,
    undo: handleUndo,
    redo: handleRedo,
    canUndo: pastStates.length > 0,
    canRedo: futureStates.length > 0,
    advanceRound,
  };
};