import React from 'react';
import type { Group, Creature } from '../types';

interface GroupProps {
  group: Group;
  onUpdate: (group: Group) => void;
  onDelete: () => void;
}

// Generate unique IDs
const generateCreatureId = () => `c-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const GroupComponent: React.FC<GroupProps> = ({ group, onUpdate, onDelete }) => {
  const handleGroupCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ ...group, hasActed: e.target.checked });
  };

  const handleCreatureUpdate = (index: number, creature: Creature) => {
    const newCreatures = [...group.creatures];
    newCreatures[index] = creature;
    onUpdate({ ...group, creatures: newCreatures });
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
    onUpdate({ ...group, creatures: [...group.creatures, newCreature] });
  };

  const handleRemoveCreature = (index: number) => {
    const newCreatures = group.creatures.filter((_, i) => i !== index);
    onUpdate({ ...group, creatures: newCreatures });
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

  return (
    <div className="group-container">
      <div className="group-header">
        <label className="group-checkbox-label">
          <input
            type="checkbox"
            className="group-checkbox large-checkbox"
            checked={group.hasActed}
            onChange={handleGroupCheckboxChange}
          />
          <span className="group-label-text">Group Acted</span>
        </label>
        <button className="delete-btn" onClick={onDelete} title="Delete group">
          ×
        </button>
      </div>

      <div className="creatures-stack">
        {group.creatures.map((creature, index) => (
          <div key={creature.creatureId} className="creature-line">
            <input
              type="text"
              className="creature-name"
              value={creature.name}
              onChange={(e) => handleCreatureUpdate(index, { ...creature, name: e.target.value })}
              placeholder="Creature name"
            />
            
            <div className="stamina-section">
              <label className="field-label">STA</label>
              <input
                type="number"
                className="stamina-input"
                value={creature.currentStamina}
                onChange={(e) => handleCreatureUpdate(index, { ...creature, currentStamina: parseInt(e.target.value) || 0 })}
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
                  value={creature.minionCount || 0}
                  onChange={(e) => handleCreatureUpdate(index, { ...creature, minionCount: parseInt(e.target.value) || 0 })}
                  title="Minion count"
                />
                <span className="minion-x">×</span>
                <input
                  type="number"
                  className="stamina-per-input"
                  value={creature.staminaPerMinion || 0}
                  onChange={(e) => handleCreatureUpdate(index, { ...creature, staminaPerMinion: parseInt(e.target.value) || 0 })}
                  title="Stamina per minion"
                />
              </div>
            )}

            <div className="quick-stats">
              <div className="stat">
                <label className="stat-label">SPD</label>
                <input
                  type="number"
                  className="stat-input"
                  value={creature.speed}
                  onChange={(e) => handleCreatureUpdate(index, { ...creature, speed: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="stat">
                <label className="stat-label">STB</label>
                <input
                  type="number"
                  className="stat-input"
                  value={creature.stability}
                  onChange={(e) => handleCreatureUpdate(index, { ...creature, stability: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="stat">
                <label className="stat-label">FS</label>
                <input
                  type="number"
                  className="stat-input"
                  value={creature.freeStrike}
                  onChange={(e) => handleCreatureUpdate(index, { ...creature, freeStrike: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="stat">
                <label className="stat-label">DST</label>
                <input
                  type="number"
                  className="stat-input"
                  value={creature.distance}
                  onChange={(e) => handleCreatureUpdate(index, { ...creature, distance: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <input
              type="text"
              className="notes-input"
              value={creature.notes}
              onChange={(e) => handleCreatureUpdate(index, { ...creature, notes: e.target.value })}
              placeholder="Notes..."
            />

            <button
              className="remove-creature-btn"
              onClick={() => handleRemoveCreature(index)}
              title="Remove creature"
            >
              ×
            </button>
          </div>
        ))}
        
        <button className="add-creature-btn" onClick={handleAddCreature}>
          + Add Creature
        </button>
      </div>
    </div>
  );
};