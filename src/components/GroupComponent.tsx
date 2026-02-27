import React, { useState } from 'react';
import type { Group, Creature } from '../types';

interface GroupProps {
  group: Group;
  groupIndex: number;
  onUpdate: (group: Group, quiet?: boolean) => void;
  onDelete: () => void;
  onToggleHidden?: () => void;
  isPlayerView?: boolean;
}

// Generate unique IDs
const generateCreatureId = () => `c-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const GroupComponent: React.FC<GroupProps> = ({ group, groupIndex, onUpdate, onDelete, onToggleHidden, isPlayerView = false }) => {
  const [isEditing, setIsEditing] = useState(group.isEditing || false);
  const [localCreatures, setLocalCreatures] = useState<Creature[]>(group.creatures);

  const handleGroupCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ ...group, hasActed: e.target.checked });
  };

  const handleSaveChanges = () => {
    onUpdate({ ...group, creatures: localCreatures });
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setLocalCreatures(group.creatures);
    setIsEditing(false);
  };

  const handleCreatureUpdate = (index: number, creature: Creature) => {
    const newCreatures = [...localCreatures];
    newCreatures[index] = creature;
    setLocalCreatures(newCreatures);
  };

  const handleAddCreature = () => {
    const newCreature: Creature = {
      creatureId: generateCreatureId(),
      name: 'New Creature',
      currentStamina: 10,
      isMinion: false,
      speed: 5,
      stability: 0,
      freeStrike: 2,
      distance: 5,
      notes: '',
    };
    setLocalCreatures([...localCreatures, newCreature]);
  };

  const handleRemoveCreature = (index: number) => {
    const newCreatures = localCreatures.filter((_, i) => i !== index);
    setLocalCreatures(newCreatures);
  };

  const getMinionThresholds = (creature: Creature): number[] => {
    if (!creature.isMinion || !creature.minionCount || !creature.staminaPerMinion) {
      return [];
    }
    const thresholds: number[] = [];
    for (let i = 1; i <= creature.minionCount; i++) {
      thresholds.push(i * creature.staminaPerMinion);
    }
    return thresholds;
  };

  const isThresholdStrikethrough = (creature: Creature, threshold: number): boolean => {
    return creature.currentStamina < threshold;
  };

  // Handle number input - don't save on change
  const handleNumberChange = (index: number, field: keyof Creature, value: string) => {
    const newCreatures = [...localCreatures];
    newCreatures[index] = { ...newCreatures[index], [field]: value };
    setLocalCreatures(newCreatures);
  };

  const handleNumberBlur = (index: number, _field: keyof Creature, value: string) => {
    const parsed = parseInt(value, 10);
    const newCreatures = [...localCreatures];
    newCreatures[index] = { ...newCreatures[index], currentStamina: isNaN(parsed) ? 0 : parsed };
    setLocalCreatures(newCreatures);
  };

  const handleTextChange = (index: number, field: keyof Creature, value: string) => {
    const newCreatures = [...localCreatures];
    newCreatures[index] = { ...newCreatures[index], [field]: value };
    setLocalCreatures(newCreatures);
  };

  const creaturesToRender = isEditing ? localCreatures : group.creatures;

  // Local state for stamina during typing (to fix 0 -> 01 issue)
  const [localStamina, setLocalStamina] = useState<Record<string, string>>({});

  // Handle stamina change - use local state until blur
  const handleStaminaChange = (index: number, value: string) => {
    // Store in local state - don't save yet
    setLocalStamina(prev => ({ ...prev, [index]: value }));
  };

  const handleStaminaBlur = (index: number, value: string) => {
    // On blur, parse and save without adding to history
    const parsed = parseInt(value, 10);
    const newCreatures = [...group.creatures];
    newCreatures[index] = { ...newCreatures[index], currentStamina: isNaN(parsed) ? 0 : parsed };
    // Use quiet save - don't add to history for quick edits
    onUpdate({ ...group, creatures: newCreatures }, true);
    // Clear local state
    setLocalStamina(prev => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
  };

  // Get display value - use local if typing, otherwise from group
  const getStaminaDisplay = (index: number, actualValue: number): string => {
    if (localStamina[index] !== undefined) {
      return localStamina[index];
    }
    return actualValue.toString();
  };

  return (
    <div className={`group-row ${group.hidden ? 'hidden' : ''}`}>
      {/* Left: Group Tracker (stacked Group # + checkbox) */}
      <div className="group-tracker">
        <span className="group-number">G{groupIndex + 1}</span>
        <input
          type="checkbox"
          className="group-checkbox"
          checked={group.hasActed}
          onChange={handleGroupCheckboxChange}
          title="Group has acted"
        />
      </div>

      {/* Middle: Creatures list */}
      <div className="creatures-list">
        {creaturesToRender.map((creature, index) => (
          <div key={creature.creatureId} className="creature-row">
            <input
              type="text"
              className="creature-name"
              value={creature.name}
              onChange={(e) => handleTextChange(index, 'name', e.target.value)}
              placeholder="Name"
              disabled={!isEditing}
            />
            
            {/* Center: Stamina - big and prominent */}
            <div className="stamina-center">
              <span className="stamina-label">STA:</span>
              <input
                type="text"
                inputMode="numeric"
                className="stamina-input large"
                value={getStaminaDisplay(index, creature.currentStamina)}
                onChange={(e) => handleStaminaChange(index, e.target.value)}
                onBlur={(e) => handleStaminaBlur(index, e.target.value)}
              />
              {creature.isMinion && creature.minionCount && creature.staminaPerMinion && (
                <span className="minion-thresholds-left">
                  {getMinionThresholds(creature).map((threshold, ti) => (
                    <span
                      key={ti}
                      className={`threshold ${isThresholdStrikethrough(creature, threshold) ? 'strikethrough' : ''}`}
                    >
                      [{threshold}]
                    </span>
                  ))}
                </span>
              )}
            </div>

            {/* Right side of creature row - minion toggle and notes always visible, edit controls when editing */}
            <div className="creature-extras">
              {isEditing && (
                <label className="minion-toggle">
                  <input
                    type="checkbox"
                    checked={creature.isMinion}
                    onChange={(e) => {
                      const updated = { ...creature, isMinion: e.target.checked };
                      if (e.target.checked) {
                        updated.minionCount = 4;
                        updated.staminaPerMinion = 5;
                      } else {
                        updated.minionCount = undefined;
                        updated.staminaPerMinion = undefined;
                      }
                      handleCreatureUpdate(index, updated);
                    }}
                  />
                  Minion
                </label>
              )}

              {creature.isMinion && isEditing && (
                <div className="minion-config">
                  <input
                    type="number"
                    className="minion-count-input"
                    value={creature.minionCount || ''}
                    onChange={(e) => handleNumberChange(index, 'minionCount', e.target.value)}
                    onBlur={(e) => handleNumberBlur(index, 'minionCount', e.target.value)}
                    placeholder="#"
                    title="Minion count"
                  />
                  <span className="minion-x">×</span>
                  <input
                    type="number"
                    className="stamina-per-input"
                    value={creature.staminaPerMinion || ''}
                    onChange={(e) => handleNumberChange(index, 'staminaPerMinion', e.target.value)}
                    onBlur={(e) => handleNumberBlur(index, 'staminaPerMinion', e.target.value)}
                    title="Stamina per minion"
                  />
                </div>
              )}

              {/* Notes - always visible and editable, quiet save */}
              <input
                type="text"
                className="notes-input"
                value={creature.notes}
                onChange={(e) => {
                  const newCreatures = [...group.creatures];
                  newCreatures[index] = { ...newCreatures[index], notes: e.target.value };
                  onUpdate({ ...group, creatures: newCreatures }, true); // quiet save
                }}
                placeholder="Notes..."
              />

              {isEditing && (
                <button
                  className="remove-creature-btn"
                  onClick={() => handleRemoveCreature(index)}
                  title="Remove creature"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        ))}
        
        {isEditing && (
          <button className="add-creature-btn" onClick={handleAddCreature}>
            + Add Creature
          </button>
        )}
      </div>

      {/* Far right: Edit/Delete buttons */}
      <div className="group-actions">
        {!isPlayerView && onToggleHidden && (
          <button 
            className={`hide-toggle-btn ${group.hidden ? 'hidden' : ''}`}
            onClick={onToggleHidden}
            title={group.hidden ? "Show in player view" : "Hide from player view"}
          >
            {group.hidden ? '👁' : '👁'}
          </button>
        )}
        {isEditing ? (
          <>
            <button className="save-btn" onClick={handleSaveChanges} title="Save">
              ✓
            </button>
            <button className="cancel-btn" onClick={handleCancelEdit} title="Cancel">
              ✕
            </button>
          </>
        ) : (
          !isPlayerView && (
            <button className="edit-btn" onClick={() => setIsEditing(true)} title="Edit group">
              ✎
            </button>
          )
        )}
        {!isPlayerView && (
          <button className="delete-btn" onClick={onDelete} title="Delete group">
            ×
          </button>
        )}
      </div>
    </div>
  );
};