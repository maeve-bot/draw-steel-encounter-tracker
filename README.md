# Draw Steel Encounter Tracker

A low-friction digital encounter tracker for the Draw Steel TTRPG.

## Features

- **Group & Creature Management** - Add creature groups with stats (stamina, speed, stability, free strike, distance)
- **Minion Tracking** - Auto-strikethrough logic for minions when stamina drops below thresholds
- **Undo/Redo** - Full history support with Ctrl+Z / Ctrl+Y
- **Round Advancement** - Resets group "has acted" checkboxes
- **Player View** - Separate `/p/:id` route that's view-only (hides malice, stamina, success/failure, notes, stats)
- **Show/Hide Toggle** - Director can hide groups from player view
- **Hero Turn Tracker** - Track which heroes have acted this round (resets on new round)
- **Agent API** - Full schema documentation at `/agent.md` for AI agents

## Tech Stack

- React + TypeScript
- Vite (build tool)
- localStorage (persistence)
- React Router (routing)

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Routes

| Route | Description |
|-------|-------------|
| `/` | Home - create new encounter |
| `/e/:id` | Director view - full editing capabilities |
| `/p/:id` | Player view - read-only, hidden info |
| `/agent.md` | API schema and validation script |

## Data Schema

```typescript
interface Encounter {
  id: string;           // 12-char alphanumeric
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

interface Group {
  groupId: string;
  hasActed: boolean;
  creatures: Creature[];
  hidden?: boolean;     // hidden from player view
}

interface Creature {
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

interface Hero {
  id: string;
  name: string;
  hasActedThisRound: boolean;
}
```

## Key Files

- `src/App.tsx` - Main app with routing
- `src/pages/EncounterPage.tsx` - Encounter editor page
- `src/components/GroupComponent.tsx` - Group/creature UI
- `src/types.ts` - TypeScript interfaces
- `src/hooks/useEncounter.ts` - State management with undo/redo
- `src/storage.ts` - Storage interface (localStorage implementation)

## Notes

- Data persists in browser localStorage with key prefix `draw-steel-encounter-`
- 12-character URL-friendly IDs generated on encounter creation
- Player view dynamically updates as director makes changes
- Hidden groups are greyed in director view and completely hidden in player view