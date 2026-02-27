import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { EncounterPage, HomePage } from './pages';
import './App.css';

// Wrapper to get the ID from URL params - director view
const EncounterPageWrapper: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  if (!id) return <Navigate to="/" replace />;
  return <EncounterPage id={id} isPlayerView={false} />;
};

// Wrapper for player view
const PlayerViewWrapper: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  if (!id) return <Navigate to="/" replace />;
  return <EncounterPage id={id} isPlayerView={true} />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/e/:id" element={<EncounterPageWrapper />} />
        <Route path="/p/:id" element={<PlayerViewWrapper />} />
        <Route path="/agent.md" element={<AgentDocsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

// Agent documentation page
const AgentDocsPage: React.FC = () => {
  return (
    <div className="agent-docs-page">
      <pre className="agent-docs-content">{`# Encounter Tracker Agent API

## Overview

This document describes how an AI agent can create and manage encounters in the Draw Steel Encounter Tracker.

## Base URL

\`\`\`
https://your-domain.com/e/{encounter_id}
\`\`\`

## Player View URL

\`\`\`
https://your-domain.com/p/{encounter_id}
\`\`\`

## Data Storage

The tracker uses browser \`localStorage\` with the key prefix \`draw-steel-encounter-\`.

## Schema

### Encounter

\`\`\`json
{
  "id": "string (12-char alphanumeric)",
  "encounterName": "string",
  "currentRound": "number (starts at 1)",
  "totalMalice": "number",
  "numberOfHeroes": "number",
  "heroesVictories": "number",
  "successCondition": "string",
  "failureCondition": "string",
  "groups": "Group[]",
  "heroes": "Hero[]"
}
\`\`\`

### Group

\`\`\`json
{
  "groupId": "string (unique)",
  "hasActed": "boolean",
  "creatures": "Creature[]",
  "hidden": "boolean (optional, default false)"
}
\`\`\`

### Creature

\`\`\`json
{
  "creatureId": "string (unique)",
  "name": "string",
  "currentStamina": "number",
  "isMinion": "boolean",
  "minionCount": "number (optional, for minions)",
  "staminaPerMinion": "number (optional, for minions)",
  "speed": "number",
  "stability": "number",
  "freeStrike": "number",
  "distance": "number",
  "notes": "string"
}
\`\`\`

### Hero

\`\`\`json
{
  "id": "string (unique)",
  "name": "string",
  "hasActedThisRound": "boolean"
}
\`\`\`

## Validation Script

Here's a Node.js script to validate your encounter JSON before posting:

\`\`\`javascript
const SCHEMA = {
  id: { type: 'string', required: true, pattern: /^[a-zA-Z0-9]{12}$/ },
  encounterName: { type: 'string', required: true },
  currentRound: { type: 'number', required: true, min: 1 },
  totalMalice: { type: 'number', required: true, min: 0 },
  numberOfHeroes: { type: 'number', required: true, min: 1, max: 10 },
  heroesVictories: { type: 'number', required: true, min: 0 },
  successCondition: { type: 'string', required: false },
  failureCondition: { type: 'string', required: false },
  groups: { type: 'array', required: true },
  heroes: { type: 'array', required: true }
};

const CREATURE_SCHEMA = {
  creatureId: { type: 'string', required: true },
  name: { type: 'string', required: true },
  currentStamina: { type: 'number', required: true, min: 0 },
  isMinion: { type: 'boolean', required: true },
  minionCount: { type: 'number', required: false, min: 1 },
  staminaPerMinion: { type: 'number', required: false, min: 1 },
  speed: { type: 'number', required: true, min: 0 },
  stability: { type: 'number', required: true },
  freeStrike: { type: 'number', required: true, min: 0 },
  distance: { type: 'number', required: true, min: 0 },
  notes: { type: 'string', required: false }
};

function validateEncounter(encounter) {
  const errors = [];
  
  // Check required fields
  for (const [field, rules] of Object.entries(SCHEMA)) {
    const value = encounter[field];
    if (rules.required && (value === undefined || value === null)) {
      errors.push(\`Missing required field: \${field}\`);
      continue;
    }
    if (value !== undefined && rules.type && typeof value !== rules.type) {
      errors.push(\`Field \${field} must be of type \${rules.type}\`);
    }
    if (rules.pattern && value && !rules.pattern.test(value)) {
      errors.push(\`Field \${field} does not match pattern \${rules.pattern}\`);
    }
    if (rules.min !== undefined && value < rules.min) {
      errors.push(\`Field \${field} must be >= \${rules.min}\`);
    }
    if (rules.max !== undefined && value > rules.max) {
      errors.push(\`Field \${field} must be <= \${rules.max}\`);
    }
  }
  
  // Validate groups
  if (Array.isArray(encounter.groups)) {
    encounter.groups.forEach((group, i) => {
      if (!group.groupId) errors.push(\`Group \${i}: missing groupId\`);
      if (!Array.isArray(group.creatures)) {
        errors.push(\`Group \${i}: creatures must be an array\`);
      } else {
        group.creatures.forEach((creature, j) => {
          for (const [field, rules] of Object.entries(CREATURE_SCHEMA)) {
            const value = creature[field];
            if (rules.required && (value === undefined || value === null)) {
              errors.push(\`Group \${i}, Creature \${j}: missing \${field}\`);
            }
          }
        });
      }
    });
  }
  
  // Validate heroes
  if (Array.isArray(encounter.heroes)) {
    encounter.heroes.forEach((hero, i) => {
      if (!hero.id) errors.push(\`Hero \${i}: missing id\`);
      if (!hero.name) errors.push(\`Hero \${i}: missing name\`);
      if (typeof hero.hasActedThisRound !== 'boolean') {
        errors.push(\`Hero \${i}: hasActedThisRound must be boolean\`);
      }
    });
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Export for use
if (typeof module !== 'undefined') {
  module.exports = { validateEncounter };
}
\`\`\`

## Example: Creating an Encounter

1. Generate a 12-character alphanumeric ID
2. Create the encounter JSON following the schema
3. Store in localStorage with key \`draw-steel-encounter-{id}\`
4. Redirect to \`/e/{id}\`

## Example: Adding a Creature Group

\`\`\`javascript
const group = {
  groupId: 'g-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
  hasActed: false,
  creatures: [{
    creatureId: 'c-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
    name: 'Goblin Grunt',
    currentStamina: 5,
    isMinion: true,
    minionCount: 4,
    staminaPerMinion: 5,
    speed: 6,
    stability: 0,
    freeStrike: 1,
    distance: 0,
    notes: ''
  }]
};
\`\`\`

## Notes

- The player view (/p/:id) hides: malice, creature stamina, success/failure conditions, creature notes, and creature stats (speed, stability, free strike, distance)
- Hidden groups are not shown in player view and are greyed in director view
- Hero turn tracking resets when a new round is started
`}</pre>
    </div>
  );
}

export default App;