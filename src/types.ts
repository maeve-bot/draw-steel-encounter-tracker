export interface Creature {
  creatureId: string;
  name: string;
  currentStamina: number;
  isMinion: boolean;
  minionCount?: number;
  staminaPerMinion?: number;
  speed: number;
  stability: number;
  freeStrike: number;
  distance: number;
  notes: string;
}

export interface Group {
  groupId: string;
  hasActed: boolean;
  creatures: Creature[];
  isEditing?: boolean; // transient state, not persisted
}

export interface Encounter {
  id: string;
  encounterName: string;
  currentRound: number;
  totalMalice: number;
  numberOfHeroes: number;
  heroesVictories: number;
  successCondition: string;
  failureCondition: string;
  groups: Group[];
}

export const createEmptyEncounter = (id: string): Encounter => ({
  id,
  encounterName: 'New Encounter',
  currentRound: 1,
  totalMalice: 0,
  numberOfHeroes: 4,
  heroesVictories: 0,
  successCondition: '',
  failureCondition: '',
  groups: [],
});