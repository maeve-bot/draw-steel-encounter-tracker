# Draw Steel Encounter Tracker

A low-friction digital encounter tracker for the [Draw Steel](https://drawsteel.rpg/) tabletop RPG. Built with React, TypeScript, and Vite.

![Draw Steel Encounter Tracker](https://img.shields.io/badge/Draw%20Steel-Encounter%20Tracker-orange)

## Features

- **Fast & Reactive** - Instant UI updates as you type
- **Low-Friction Design** - Clean digital translation of the paper character sheet
- **Undo/Redo** - Ctrl+Z / Ctrl+Y for instant undo/redo (in-memory)
- **Auto-Save** - Debounced saves (500ms) to local storage
- **Swappable Storage** - Uses a storage interface that can be swapped for Firebase, Supabase, etc.
- **Round Tracking** - Advance round automatically unchecks all creatures
- **Minion Groups** - Auto-strikethrough thresholds as stamina drops

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

Then open http://localhost:5173 in your browser.

## Usage

1. Click **"+ New Encounter"** to create a new encounter
2. Share the URL with players (format: `/e/:id`)
3. Add **Groups** of creatures using the "+ Add Group" button
4. Add **Creatures** to each group with their stats
5. Check the box when a group has acted
6. Click **"Advance Round"** to increment the round and uncheck all groups

### Keyboard Shortcuts

- `Ctrl+Z` - Undo
- `Ctrl+Y` or `Ctrl+Shift+Z` - Redo

## Storage

Currently uses browser `localStorage`. To swap to a different backend:

1. Implement the `EncounterStorage` interface in `src/storage/`
2. Update `src/storage/index.ts` to export your new storage class

```typescript
export interface EncounterStorage {
  get(id: string): Promise<Encounter | undefined>;
  save(encounter: Encounter): Promise<void>;
  delete(id: string): Promise<void>;
  create(id: string): Promise<Encounter>;
}
```

## Tech Stack

- React 19
- TypeScript
- Vite
- React Router
- localStorage (swappable)

## License

MIT