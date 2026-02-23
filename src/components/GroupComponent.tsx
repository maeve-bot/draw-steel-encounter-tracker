import React, { useState } from 'react';
import type { Group, Creature } from '../types';

interface GroupProps {
  group: Group;
  groupIndex: number;
  onUpdate: (group: Group) => void;
  onDelete: () => void;
}

// Generate unique IDs
const generateCreatureId = () => `c-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const GroupComponent: React.FC<GroupProps> = ({ group, groupIndex, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
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

  // Handle number input - don't save on change, handle blank/zero properly
  const handleNumberChange = (index: number, field: keyof Creature, value: string) => {
    // Just update local state, don't save yet
    // Empty string allowed during typing
    const newCreatures = [...localCreatures];
    newCreatures[index] = { ...newCreatures[index], [field]: value };
    setLocalCreatures(newCreatures);
  };

  const handleNumberBlur = (index: number, _field: keyof Creature, value: string) => {
    // On blur, parse and save - default to currentStamina field
    const parsed = parseInt(value, 10);
    const newCreatures = [...localCreatures];
    newCreatures[index] = { ...newCreatures[index], currentStamina: isNaN(parsed) ? 0 : parsed };
    setLocalCreatures(newCreatures);
  };

  // Simple text input that saves on blur
  const handleTextChange = (index: number, field: keyof Creature, value: string) => {
    const newCreatures = [...localCreatures];
    newCreatures[index] = { ...newCreatures[index], [field]: value };
    setLocalCreatures(newCreatures);
  };

  const handleTextBlur = (_index: number, _field: keyof Creature, _value: string) => {
    // Just trigger save - value is already in local state
  };

  const creaturesToRender = isEditing ? localCreatures : group.creatures;

  return (
    <div className="group-container">
      <div className="group-header">
        <div className="group-label-section">
          <span className="group-number">Group {groupIndex + 1}</span>
          <label className="group-checkbox-label">
            <input
              type="checkbox"
              className="group-checkbox large-checkbox"
              checked={group.hasActed}
              onChange={handleGroupCheckboxChange}
            />
          </label>
        </div>
        <div className="group-actions">
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
            <button className="edit-btn" onClick={() => setIsEditing(true)} title="Edit group">
              ✎
            </button>
          )}
          <button className="delete-btn" onClick={onDelete} title="Delete group">
            ×
          </button>
        </div>
      </div>

      <div className="creatures-stack">
        {creaturesToRender.map((creature, index) => (
          <div key={creature.creatureId} className="creature-line">
            <input
              type="text"
              className="creature-name"
              value={creature.name}
              onChange={(e) => handleTextChange(index, 'name', e.target.value)}
              onBlur={() => handleTextBlur(index, 'name', creature.name)}
              placeholder="Creature name"
              disabled={!isEditing}
            />
            
            <div className="stamina-section">
              <label className="field-label">STA</label>
              <input
                type="number"
                className="stamina-input"
                value={creature.currentStamina}
                onChange={(e) => handleNumberChange(index, 'currentStamina', e.target.value)}
                onBlur={(e) => handleNumberBlur(index, 'currentStamina', e.target.value)}
                disabled={!isEditing}
              />
              
              {creature.isMinion && creature.minionCount && creature.staminaPerMinion && (
                <div className="minion-thresholds">
                  {getMinionThresholds(creature).map((threshold, ti) => (
                    <span
                      key={ti}
                      className={`threshold ${isThresholdStrikethrough(creature, threshold) ? 'strikethrough' : ''}`}
                    >
                      [{threshold}]
                    </span>
                  ))}
                </div>
              )}
            </div>

            {isEditing && (
              <>
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

                {creature.isMinion && (
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

                <input
                  type="text"
                  className="notes-input"
                  value={creature.notes}
                  onChange={(e) => handleTextChange(index, 'notes', e.target.value)}
                  onBlur={() => handleTextBlur(index, 'notes', creature.notes)}
                  placeholder="Notes..."
                />

                <button
                  className="remove-creature-btn"
                  onClick={() => handleRemoveCreature(index)}
                  title="Remove creature"
                >
                  ×
                </button>
              </>
            )}
          </div>
        ))}
        
        {isEditing && (
          <button className="add-creature-btn" onClick={handleAddCreature}>
            + Add Creature
          </button>
        )}
      </div>
    </div>
  );
};