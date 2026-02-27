export interface Hero {
  id: string;
  name: string;
  hasActedThisRound: boolean;
}

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
  hidden?: boolean; // hidden from player view, greyed for director
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
  heroes: Hero[];
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
  heroes: [
    { id: 'h1', name: 'Hero 1', hasActedThisRound: false },
    { id: 'h2', name: 'Hero 2', hasActedThisRound: false },
    { id: 'h3', name: 'Hero 3', hasActedThisRound: false },
    { id: 'h4', name: 'Hero 4', hasActedThisRound: false },
  ],
});