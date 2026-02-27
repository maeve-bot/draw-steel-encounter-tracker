import React from 'react';
import type { Encounter, Group, Hero } from '../types';
import { GroupComponent } from '../components';
import { useEncounter } from '../hooks/useEncounter';
import { generateId } from '../storage';

// Generate unique IDs
const generateGroupId = () => `g-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
const generateHeroId = () => `h-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

interface EncounterPageProps {
  id: string;
  isPlayerView?: boolean;
}

export const EncounterPage: React.FC<EncounterPageProps> = ({ id, isPlayerView = false }) => {
  const { encounter, loading, error, save, saveQuiet, undo, redo, canUndo, canRedo } = useEncounter(id);

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
      isEditing: true, // Start in edit mode
    };

    handleEncounterUpdate({
      ...encounter,
      groups: [...encounter.groups, newGroup],
    });
  };

  const handleGroupUpdate = (index: number, updatedGroup: Group, quiet?: boolean) => {
    if (!encounter) return;
    const newGroups = [...encounter.groups];
    newGroups[index] = updatedGroup;
    if (quiet) {
      saveQuiet({ ...encounter, groups: newGroups });
    } else {
      handleEncounterUpdate({ ...encounter, groups: newGroups });
    }
  };

  const handleGroupDelete = (index: number) => {
    if (!encounter) return;
    const newGroups = encounter.groups.filter((_: Group, i: number) => i !== index);
    handleEncounterUpdate({ ...encounter, groups: newGroups });
  };

  const handleToggleGroupHidden = (index: number) => {
    if (!encounter) return;
    const newGroups = [...encounter.groups];
    newGroups[index] = { ...newGroups[index], hidden: !newGroups[index].hidden };
    handleEncounterUpdate({ ...encounter, groups: newGroups });
  };

  const copyLink = () => {
    const url = `${window.location.origin}/e/${id}`;
    navigator.clipboard.writeText(url);
    alert('Link copied to clipboard!');
  };

  const copyPlayerLink = () => {
    const url = `${window.location.origin}/p/${id}`;
    navigator.clipboard.writeText(url);
    alert('Player view link copied to clipboard!');
  };

  // Hero management
  const handleHeroUpdate = (index: number, updatedHero: Hero) => {
    if (!encounter) return;
    const newHeroes = [...encounter.heroes];
    newHeroes[index] = updatedHero;
    handleEncounterUpdate({ ...encounter, heroes: newHeroes });
  };

  const handleAddHero = () => {
    if (!encounter) return;
    const newHero: Hero = {
      id: generateHeroId(),
      name: `Hero ${encounter.heroes.length + 1}`,
      hasActedThisRound: false,
    };
    handleEncounterUpdate({
      ...encounter,
      heroes: [...encounter.heroes, newHero],
    });
  };

  const handleRemoveHero = (index: number) => {
    if (!encounter) return;
    const newHeroes = encounter.heroes.filter((_: Hero, i: number) => i !== index);
    handleEncounterUpdate({ ...encounter, heroes: newHeroes });
  };

  // Custom advance round that also resets hero checkboxes
  const handleAdvanceRound = async () => {
    if (!encounter) return;
    
    // Reset hero hasActedThisRound and group hasActed, then advance round
    const resetHeroes = encounter.heroes.map(h => ({ ...h, hasActedThisRound: false }));
    const updated: Encounter = {
      ...encounter,
      heroes: resetHeroes,
      currentRound: encounter.currentRound + 1,
      groups: encounter.groups.map((group: Group) => ({
        ...group,
        hasActed: false,
      })),
    };
    
    // Save with history tracking
    await save(updated);
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
    <div className={`encounter-page ${isPlayerView ? 'player-view' : ''}`}>
      {/* Top Bar */}
      <div className="top-bar">
        <input
          type="text"
          className="encounter-name-input"
          value={encounter.encounterName}
          onChange={(e) => handleEncounterUpdate({ ...encounter, encounterName: e.target.value })}
          placeholder="Encounter Name"
          readOnly={isPlayerView}
        />
        
        <div className="session-controls">
          {!isPlayerView && (
            <>
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
            </>
          )}
          <button 
            className="control-btn copy-btn" 
            onClick={isPlayerView ? copyPlayerLink : copyLink}
            title={isPlayerView ? "Copy player view link" : "Copy director link"}
          >
            📋
          </button>
          {!isPlayerView && (
            <button 
              className="player-view-link-btn"
              onClick={copyPlayerLink}
              title="Copy player view link"
            >
              🎭 Player View
            </button>
          )}
        </div>
      </div>

      {/* Hero Turn Tracker - shown on both views */}
      <div className="hero-turn-tracker">
        <h3>Hero Turns - Round {encounter.currentRound}</h3>
        <div className="heroes-list">
          {(encounter.heroes || []).map((hero, index) => (
            <div key={hero.id} className="hero-item">
              <input
                type="checkbox"
                checked={hero.hasActedThisRound}
                onChange={(e) => handleHeroUpdate(index, { ...hero, hasActedThisRound: e.target.checked })}
                disabled={isPlayerView}
              />
              <input
                type="text"
                value={hero.name}
                onChange={(e) => handleHeroUpdate(index, { ...hero, name: e.target.value })}
                placeholder="Hero name"
                readOnly={isPlayerView}
              />
              {!isPlayerView && encounter.heroes.length > 1 && (
                <button 
                  className="remove-creature-btn"
                  onClick={() => handleRemoveHero(index)}
                  title="Remove hero"
                >
                  ×
                </button>
              )}
            </div>
          ))}
          {!isPlayerView && (
            <button 
              className="add-creature-btn"
              onClick={handleAddHero}
              style={{ padding: '0.5rem' }}
            >
              + Add Hero
            </button>
          )}
        </div>
      </div>

      {/* Encounter Overview Panel - split in half */}
      <div className="overview-panel">
        {/* Left: Heroes, Victories, Malice */}
        <div className="overview-left">
          <div className="overview-left-top">
            <div className="overview-field">
              <label>Heroes</label>
              <input
                type="number"
                value={encounter.numberOfHeroes}
                onChange={(e) => handleEncounterUpdate({ ...encounter, numberOfHeroes: parseInt(e.target.value) || 0 })}
                readOnly={isPlayerView}
              />
            </div>
            <div className="overview-field">
              <label>Victories</label>
              <input
                type="number"
                value={encounter.heroesVictories}
                onChange={(e) => handleEncounterUpdate({ ...encounter, heroesVictories: parseInt(e.target.value) || 0 })}
                readOnly={isPlayerView}
              />
            </div>
          </div>
          <div className="overview-field malice-field">
            <label>Malice</label>
            <input
              type="number"
              className="malice-input"
              value={encounter.totalMalice}
              onChange={(e) => handleEncounterUpdate({ ...encounter, totalMalice: parseInt(e.target.value) || 0 })}
              readOnly={isPlayerView}
            />
          </div>
        </div>
        
        {/* Right: Success/Failure conditions stacked */}
        <div className="overview-right">
          <div className="condition-field">
            <label>Success Condition</label>
            <textarea
              value={encounter.successCondition}
              onChange={(e) => handleEncounterUpdate({ ...encounter, successCondition: e.target.value })}
              placeholder="What must the heroes accomplish?"
              readOnly={isPlayerView}
            />
          </div>
          <div className="condition-field">
            <label>Failure Condition</label>
            <textarea
              value={encounter.failureCondition}
              onChange={(e) => handleEncounterUpdate({ ...encounter, failureCondition: e.target.value })}
              placeholder="What happens if they fail?"
              readOnly={isPlayerView}
            />
          </div>
        </div>
      </div>

      {/* Round Control */}
      <div className="round-control">
        <span className="round-label">Round</span>
        <span className="round-number">{encounter.currentRound}</span>
        {!isPlayerView && (
          <button className="advance-round-btn" onClick={handleAdvanceRound}>
            Advance Round →
          </button>
        )}
      </div>

      {/* Roster - Groups */}
      <div className="roster">
        {encounter.groups.map((group, index) => (
          <GroupComponent
            key={group.groupId}
            group={group}
            groupIndex={index}
            onUpdate={(updated) => handleGroupUpdate(index, updated)}
            onDelete={() => handleGroupDelete(index)}
            onToggleHidden={() => handleToggleGroupHidden(index)}
            isPlayerView={isPlayerView}
          />
        ))}
        
        {!isPlayerView && (
          <button className="add-group-btn" onClick={handleAddGroup}>
            + Add Group
          </button>
        )}
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