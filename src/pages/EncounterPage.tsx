import React from 'react';
import type { Encounter, Group } from '../types';
import { GroupComponent } from '../components';
import { useEncounter } from '../hooks/useEncounter';
import { generateId } from '../storage';

// Generate unique IDs
const generateGroupId = () => `g-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

interface EncounterPageProps {
  id: string;
}

export const EncounterPage: React.FC<EncounterPageProps> = ({ id }) => {
  const { encounter, loading, error, save, undo, redo, canUndo, canRedo, advanceRound } = useEncounter(id);

  const handleEncounterUpdate = (updated: Encounter) => {
    save(updated);
  };

  const handleAddGroup = () => {
    if (!encounter) return;
    
    const newGroup: Group = {
      groupId: generateGroupId(),
      hasActed: false,
      creatures: [{
        creatureId: `c-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: 'New Creature',
        currentStamina: 10,
        isMinion: false,
        speed: 5,
        stability: 0,
        freeStrike: 2,
        distance: 5,
        notes: '',
      }],
    };

    handleEncounterUpdate({
      ...encounter,
      groups: [...encounter.groups, newGroup],
    });
  };

  const handleGroupUpdate = (index: number, updatedGroup: Group) => {
    if (!encounter) return;
    const newGroups = [...encounter.groups];
    newGroups[index] = updatedGroup;
    handleEncounterUpdate({ ...encounter, groups: newGroups });
  };

  const handleGroupDelete = (index: number) => {
    if (!encounter) return;
    const newGroups = encounter.groups.filter((_: Group, i: number) => i !== index);
    handleEncounterUpdate({ ...encounter, groups: newGroups });
  };

  const copyLink = () => {
    const url = `${window.location.origin}/e/${id}`;
    navigator.clipboard.writeText(url);
    alert('Link copied to clipboard!');
  };

  if (loading) {
    return <div className="loading">Loading encounter...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  if (!encounter) {
    return <div className="error">Encounter not found</div>;
  }

  return (
    <div className="encounter-page">
      {/* Top Bar */}
      <div className="top-bar">
        <input
          type="text"
          className="encounter-name-input"
          value={encounter.encounterName}
          onChange={(e) => handleEncounterUpdate({ ...encounter, encounterName: e.target.value })}
          placeholder="Encounter Name"
        />
        
        <div className="session-controls">
          <button 
            className="control-btn" 
            onClick={undo} 
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
          >
            ↶
          </button>
          <button 
            className="control-btn" 
            onClick={redo} 
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
          >
            ↷
          </button>
          <button 
            className="control-btn copy-btn" 
            onClick={copyLink}
            title="Copy link"
          >
            📋
          </button>
        </div>
      </div>

      {/* Encounter Overview Panel */}
      <div className="overview-panel">
        <div className="overview-row">
          <div className="overview-field">
            <label>Heroes</label>
            <input
              type="number"
              value={encounter.numberOfHeroes}
              onChange={(e) => handleEncounterUpdate({ ...encounter, numberOfHeroes: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div className="overview-field">
            <label>Victories</label>
            <input
              type="number"
              value={encounter.heroesVictories}
              onChange={(e) => handleEncounterUpdate({ ...encounter, heroesVictories: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div className="overview-field malice-field">
            <label>Malice</label>
            <input
              type="number"
              className="malice-input"
              value={encounter.totalMalice}
              onChange={(e) => handleEncounterUpdate({ ...encounter, totalMalice: parseInt(e.target.value) || 0 })}
            />
          </div>
        </div>
        
        <div className="overview-conditions">
          <div className="condition-field">
            <label>Success Condition</label>
            <textarea
              value={encounter.successCondition}
              onChange={(e) => handleEncounterUpdate({ ...encounter, successCondition: e.target.value })}
              placeholder="What must the heroes accomplish?"
            />
          </div>
          <div className="condition-field">
            <label>Failure Condition</label>
            <textarea
              value={encounter.failureCondition}
              onChange={(e) => handleEncounterUpdate({ ...encounter, failureCondition: e.target.value })}
              placeholder="What happens if they fail?"
            />
          </div>
        </div>
      </div>

      {/* Round Control */}
      <div className="round-control">
        <span className="round-label">Round</span>
        <span className="round-number">{encounter.currentRound}</span>
        <button className="advance-round-btn" onClick={advanceRound}>
          Advance Round →
        </button>
      </div>

      {/* Roster - Groups */}
      <div className="roster">
        {encounter.groups.map((group, index) => (
          <GroupComponent
            key={group.groupId}
            group={group}
            onUpdate={(updated) => handleGroupUpdate(index, updated)}
            onDelete={() => handleGroupDelete(index)}
          />
        ))}
        
        <button className="add-group-btn" onClick={handleAddGroup}>
          + Add Group
        </button>
      </div>
    </div>
  );
};

// Home page component
export const HomePage: React.FC = () => {
  const handleNewEncounter = () => {
    const id = generateId();
    window.location.href = `/e/${id}`;
  };

  return (
    <div className="home-page">
      <h1>Draw Steel Encounter Tracker</h1>
      <p>A low-friction digital encounter tracker for Draw Steel GMs.</p>
      <button className="new-encounter-btn" onClick={handleNewEncounter}>
        + New Encounter
      </button>
    </div>
  );
};