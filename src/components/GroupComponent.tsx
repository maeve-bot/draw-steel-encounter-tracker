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

  return (
    <div className="group-row">
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
              <input
                type="number"
                className="stamina-input large"
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
                      {threshold}
                    </span>
                  ))}
                </div>
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

              {/* Notes - always visible */}
              <input
                type="text"
                className="notes-input"
                value={creature.notes}
                onChange={(e) => handleTextChange(index, 'notes', e.target.value)}
                placeholder="Notes..."
                disabled={!isEditing}
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
  );
};