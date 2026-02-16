import React, { useState, useEffect, useCallback, useRef } from 'react';

const LEVELS = [
  {
    title: "Уровень 1 — Основы",
    description: "Уравновесь рычаг. Перетащи фигуры на доску.",
    hint: "Вес × расстояние слева = вес × расстояние справа",
    staticObjects: [
      { type: 'circle', size: 'medium', weight: 2, position: 2, color: '#8B9DAF' }
    ],
    inventory: [
      { id: 'c1', type: 'circle', size: 'small', weight: 1, color: '#8B9DAF', count: 5 },
      { id: 'c2', type: 'circle', size: 'medium', weight: 2, color: '#8B9DAF', count: 3 }
    ],
    availableCells: [-3, -2, -1, 1, 2, 3]
  },
  {
    title: "Уровень 2 — Расстояние важно",
    description: "Чем дальше от центра — тем больше момент силы!",
    hint: "Момент = вес × расстояние от центра",
    staticObjects: [
      { type: 'circle', size: 'medium', weight: 2, position: 3, color: '#8B9DAF' }
    ],
    inventory: [
      { id: 'c1', type: 'circle', size: 'small', weight: 1, color: '#8B9DAF', count: 5 },
      { id: 'c2', type: 'circle', size: 'medium', weight: 2, color: '#8B9DAF', count: 3 }
    ],
    availableCells: [-3, -2, -1, 1, 2, 3]
  },
  {
    title: "Уровень 3 — Ограниченные ячейки",
    description: "Только ячейки -3 и -1 доступны слева!",
    hint: "Используй комбинацию расстояний",
    staticObjects: [
      { type: 'circle', size: 'medium', weight: 2, position: 2, color: '#8B9DAF' }
    ],
    inventory: [
      { id: 'c1', type: 'circle', size: 'small', weight: 1, color: '#8B9DAF', count: 5 },
      { id: 'c2', type: 'circle', size: 'medium', weight: 2, color: '#8B9DAF', count: 3 }
    ],
    availableCells: [-3, -1, 1, 2, 3]
  },
  {
    title: "Уровень 4 — Найди вес",
    description: "Синий квадрат — неизвестный вес. Уравновесь!",
    hint: "Попробуй разные комбинации, чтобы понять вес квадрата",
    staticObjects: [
      { type: 'square', size: 'medium', weight: 3, position: 2, color: '#5B8DEF', unknown: true }
    ],
    inventory: [
      { id: 'c1', type: 'circle', size: 'small', weight: 1, color: '#8B9DAF', count: 5 },
      { id: 'c2', type: 'circle', size: 'medium', weight: 2, color: '#8B9DAF', count: 3 },
      { id: 'c3', type: 'circle', size: 'large', weight: 3, color: '#8B9DAF', count: 2 }
    ],
    availableCells: [-3, -1, 1, 2, 3]
  },
  {
    title: "Уровень 5 — Комбинации",
    description: "Можно ставить несколько фигур в одну ячейку!",
    hint: "Веса в одной ячейке складываются",
    staticObjects: [
      { type: 'square', size: 'medium', weight: 4, position: 2, color: '#5B8DEF', unknown: true }
    ],
    inventory: [
      { id: 'c1', type: 'circle', size: 'small', weight: 1, color: '#8B9DAF', count: 8 },
      { id: 'c2', type: 'circle', size: 'medium', weight: 2, color: '#8B9DAF', count: 4 }
    ],
    availableCells: [-3, -2, -1, 1, 2, 3]
  }
];

const Shape = ({ type, size, color, unknown, displaySize = 1 }) => {
  const baseSize = { small: 20, medium: 28, large: 36 }[size] || 28;
  const s = baseSize * displaySize;

  if (type === 'circle') {
    return (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="16" fill={color} stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
        <ellipse cx="20" cy="16" rx="8" ry="4" fill="rgba(255,255,255,0.15)" />
      </svg>
    );
  }
  if (type === 'square') {
    return (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <rect x="4" y="4" width="32" height="32" rx="4" fill={color} stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
        {unknown && <text x="20" y="25" textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="16" fontWeight="bold">?</text>}
        {!unknown && <rect x="8" y="8" width="12" height="6" rx="2" fill="rgba(255,255,255,0.12)" />}
      </svg>
    );
  }
  if (type === 'triangle') {
    return (
      <svg width={s} height={s} viewBox="0 0 40 40">
        <polygon points="20,4 36,36 4,36" fill={color} stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
      </svg>
    );
  }
  return null;
};

const Balancerio = () => {
  const [currentLevel, setCurrentLevel] = useState(0);
  const [cells, setCells] = useState(null);
  const [solved, setSolved] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [celebrateAnim, setCelebrateAnim] = useState(false);
  const [inventoryUsed, setInventoryUsed] = useState({});
  const [draggedItem, setDraggedItem] = useState(null);
  const [touchDragItem, setTouchDragItem] = useState(null);
  const [touchPos, setTouchPos] = useState({ x: 0, y: 0 });
  const cellRefs = useRef({});

  const level = LEVELS[currentLevel];

  const initLevel = useCallback(() => {
    const newCells = {};
    LEVELS[currentLevel].staticObjects.forEach(obj => {
      newCells[obj.position] = [{ ...obj, isStatic: true }];
    });
    setCells(newCells);
    setSolved(false);
    setCelebrateAnim(false);
    setShowHint(false);
    setInventoryUsed({});
    setDraggedItem(null);
    setTouchDragItem(null);
  }, [currentLevel]);

  useEffect(() => { initLevel(); }, [initLevel]);

  const calculateMoment = useCallback((cellData) => {
    if (!cellData) return { leftMoment: 0, rightMoment: 0, difference: 0, hasUserPieces: false };
    let leftMoment = 0;
    let rightMoment = 0;
    let hasUserPieces = false;

    Object.entries(cellData).forEach(([position, objects]) => {
      const pos = parseInt(position);
      const totalWeight = objects.reduce((sum, obj) => sum + obj.weight, 0);
      const moment = Math.abs(pos) * totalWeight;
      if (objects.some(o => !o.isStatic)) hasUserPieces = true;
      if (pos < 0) leftMoment += moment;
      else if (pos > 0) rightMoment += moment;
    });

    return { leftMoment, rightMoment, difference: leftMoment - rightMoment, hasUserPieces };
  }, []);

  useEffect(() => {
    if (!cells) return;
    const { difference, hasUserPieces } = calculateMoment(cells);
    if (hasUserPieces && Math.abs(difference) < 0.01 && !solved) {
      setSolved(true);
      setCelebrateAnim(true);
      const timer = setTimeout(() => setCelebrateAnim(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [cells, calculateMoment, solved]);

  const getRotation = () => {
    const { difference } = calculateMoment(cells);
    const maxRot = 12;
    return Math.max(-maxRot, Math.min(maxRot, difference * 1.5));
  };

  const getBalanceState = () => {
    const { difference } = calculateMoment(cells);
    const abs = Math.abs(difference);
    if (abs < 0.01) return 'balanced';
    if (abs < 2) return 'close';
    return 'far';
  };

  const addToCell = useCallback((position, item) => {
    if (!level.availableCells.includes(position)) return;

    const itemKey = item.id || `${item.type}_${item.size}`;
    const used = inventoryUsed[itemKey] || 0;
    const invItem = level.inventory.find(i => (i.id || `${i.type}_${i.size}`) === itemKey);
    if (invItem && used >= invItem.count) return;

    setCells(prev => {
      if (!prev) return prev;
      const newCells = { ...prev };
      if (!newCells[position]) newCells[position] = [];
      newCells[position] = [...newCells[position], { ...item, isStatic: false }];
      return newCells;
    });
    setInventoryUsed(prev => ({ ...prev, [itemKey]: (prev[itemKey] || 0) + 1 }));
  }, [level, inventoryUsed]);

  const removeFromCell = useCallback((position, index) => {
    setCells(prev => {
      if (!prev) return prev;
      const arr = prev[position];
      if (!arr || !arr[index] || arr[index].isStatic) return prev;
      const removed = arr[index];
      const itemKey = removed.id || `${removed.type}_${removed.size}`;
      setInventoryUsed(iu => ({ ...iu, [itemKey]: Math.max(0, (iu[itemKey] || 0) - 1) }));
      const newArr = arr.filter((_, i) => i !== index);
      const newCells = { ...prev };
      if (newArr.length === 0) delete newCells[position];
      else newCells[position] = newArr;
      return newCells;
    });
  }, []);

  const handleDragStart = (e, item) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e, pos) => {
    e.preventDefault();
    if (draggedItem) {
      addToCell(pos, draggedItem);
      setDraggedItem(null);
    }
  };

  const handleTouchStart = (e, item) => {
    const touch = e.touches[0];
    setTouchDragItem(item);
    setTouchPos({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchMove = (e) => {
    if (!touchDragItem) return;
    e.preventDefault();
    const touch = e.touches[0];
    setTouchPos({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchEnd = () => {
    if (!touchDragItem) return;
    for (const [posStr, ref] of Object.entries(cellRefs.current)) {
      if (!ref) continue;
      const rect = ref.getBoundingClientRect();
      if (
        touchPos.x >= rect.left && touchPos.x <= rect.right &&
        touchPos.y >= rect.top && touchPos.y <= rect.bottom
      ) {
        addToCell(parseInt(posStr), touchDragItem);
        break;
      }
    }
    setTouchDragItem(null);
  };

  const nextLevel = () => {
    if (currentLevel < LEVELS.length - 1) setCurrentLevel(currentLevel + 1);
  };

  const resetLevel = () => initLevel();

  // Don't render until cells are initialized
  if (cells === null) return null;

  const rotation = getRotation();
  const balanceState = getBalanceState();
  const { leftMoment, rightMoment } = calculateMoment(cells);
  const balanceColor = balanceState === 'balanced' ? '#4ADE80' : balanceState === 'close' ? '#FBBF24' : '#F87171';

  return (
    <div
      style={{
        width: '100%',
        minHeight: '100vh',
        background: '#0F1923',
        color: '#E2E8F0',
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '20px 16px',
        position: 'relative',
        userSelect: 'none',
        margin: 0,
      }}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Subtle grid bg */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.03, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 12, position: 'relative', zIndex: 1 }}>
        <div style={{ fontSize: 11, letterSpacing: 3, color: '#5B8DEF', marginBottom: 4, textTransform: 'uppercase' }}>
          Balancerio
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px', color: '#F1F5F9' }}>
          {level.title}
        </h1>
        <p style={{ fontSize: 13, color: '#8B9DAF', margin: 0 }}>{level.description}</p>
      </div>

      {/* Level dots */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {LEVELS.map((_, i) => (
          <div key={i} style={{
            width: 8, height: 8, borderRadius: '50%',
            background: i === currentLevel ? '#5B8DEF' : i < currentLevel ? '#4ADE80' : '#2A3A4E',
            transition: 'all 0.3s',
            boxShadow: i === currentLevel ? '0 0 8px #5B8DEF' : 'none',
          }} />
        ))}
      </div>

      {/* Balance indicator */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16,
        padding: '8px 20px', borderRadius: 20,
        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
      }}>
        <span style={{ fontSize: 12, color: '#8B9DAF', minWidth: 20, textAlign: 'right' }}>{leftMoment}</span>
        <div style={{ width: 120, height: 6, borderRadius: 3, background: '#1E293B', position: 'relative', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute',
            left: `${Math.max(5, Math.min(95, 50 - (leftMoment - rightMoment) * 4))}%`,
            top: '50%', transform: 'translate(-50%, -50%)',
            width: 14, height: 14, borderRadius: '50%',
            background: balanceColor,
            boxShadow: `0 0 12px ${balanceColor}`,
            transition: 'all 0.4s ease',
          }} />
        </div>
        <span style={{ fontSize: 12, color: '#8B9DAF', minWidth: 20 }}>{rightMoment}</span>
      </div>

      {/* Lever area */}
      <div style={{
        position: 'relative', width: '100%', maxWidth: 700,
        height: 240, marginBottom: 20, flexShrink: 0,
      }}>
        {/* Fulcrum triangle */}
        <div style={{
          position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
          width: 0, height: 0,
          borderLeft: '24px solid transparent', borderRight: '24px solid transparent',
          borderBottom: '40px solid #2A3A4E',
        }} />
        <div style={{
          position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
          width: 60, height: 6, borderRadius: 3, background: '#2A3A4E',
        }} />

        {/* Beam */}
        <div style={{
          position: 'absolute', bottom: 38, left: '5%', right: '5%',
          height: 8, borderRadius: 4,
          background: 'linear-gradient(90deg, #3B5068, #4A6380, #3B5068)',
          transformOrigin: 'center center',
          transform: `rotate(${rotation}deg)`,
          transition: 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
        }}>
          {[-3, -2, -1, 0, 1, 2, 3].map(pos => {
            const pct = ((pos + 3) / 6) * 100;
            const isCenter = pos === 0;
            const isAvailable = level.availableCells.includes(pos);
            const cellObjects = cells[pos] || [];
            const totalWeight = cellObjects.reduce((sum, obj) => sum + obj.weight, 0);

            if (isCenter) {
              return (
                <div key={pos} style={{
                  position: 'absolute', left: `${pct}%`, top: -6, transform: 'translateX(-50%)',
                  width: 16, height: 16, borderRadius: '50%',
                  background: '#4A6380', border: '2px solid #5B8DEF',
                  boxShadow: '0 0 8px rgba(91,141,239,0.3)',
                }} />
              );
            }

            return (
              <div
                key={pos}
                ref={el => { cellRefs.current[pos] = el; }}
                onDragOver={e => { e.preventDefault(); if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'; }}
                onDrop={e => handleDrop(e, pos)}
                style={{
                  position: 'absolute',
                  left: `${pct}%`,
                  top: -80,
                  transform: 'translateX(-50%)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                }}
              >
                {/* Distance label */}
                <div style={{ fontSize: 9, color: '#5B7A94', marginBottom: 2, fontWeight: 600 }}>
                  {Math.abs(pos)}
                </div>

                {/* Drop zone */}
                <div
                  style={{
                    width: 56, height: 60, borderRadius: 8,
                    border: `2px ${isAvailable ? 'dashed' : 'solid'} ${isAvailable ? 'rgba(91,141,239,0.3)' : 'rgba(255,255,255,0.05)'}`,
                    background: isAvailable ? 'rgba(91,141,239,0.06)' : 'rgba(0,0,0,0.2)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end',
                    position: 'relative', padding: '2px 0',
                    cursor: isAvailable ? 'default' : 'not-allowed',
                  }}
                >
                  {cellObjects.map((obj, i) => (
                    <div
                      key={i}
                      onClick={() => removeFromCell(pos, i)}
                      style={{
                        cursor: obj.isStatic ? 'default' : 'pointer',
                        opacity: obj.isStatic ? 1 : 0.9,
                        lineHeight: 0,
                      }}
                      title={obj.isStatic ? '' : 'Нажми, чтобы убрать'}
                    >
                      <Shape type={obj.type} size={obj.size} color={obj.color} unknown={obj.unknown} displaySize={0.7} />
                    </div>
                  ))}

                  {totalWeight > 0 && (
                    <div style={{
                      position: 'absolute', top: -14, fontSize: 10,
                      color: '#5B8DEF', fontWeight: 700, whiteSpace: 'nowrap',
                    }}>
                      {totalWeight}×{Math.abs(pos)}={totalWeight * Math.abs(pos)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Inventory */}
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 16, padding: '16px 20px',
        width: '100%', maxWidth: 500, position: 'relative', zIndex: 1,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 10, letterSpacing: 2, color: '#5B7A94', textTransform: 'uppercase' }}>Фигуры</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setShowHint(!showHint)} style={{
              fontSize: 11, color: '#5B8DEF', background: 'rgba(91,141,239,0.1)',
              border: '1px solid rgba(91,141,239,0.2)', borderRadius: 8,
              padding: '4px 10px', cursor: 'pointer',
            }}>
              💡 Подсказка
            </button>
            <button onClick={resetLevel} style={{
              fontSize: 11, color: '#F87171', background: 'rgba(248,113,113,0.1)',
              border: '1px solid rgba(248,113,113,0.2)', borderRadius: 8,
              padding: '4px 10px', cursor: 'pointer',
            }}>
              ↺ Сброс
            </button>
          </div>
        </div>

        {showHint && (
          <div style={{
            background: 'rgba(91,141,239,0.08)', border: '1px solid rgba(91,141,239,0.15)',
            borderRadius: 8, padding: '8px 12px', marginBottom: 12,
            fontSize: 12, color: '#8BB8EF',
          }}>
            {level.hint}
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          {level.inventory.map((item, i) => {
            const itemKey = item.id || `${item.type}_${item.size}`;
            const used = inventoryUsed[itemKey] || 0;
            const remaining = item.count - used;

            return (
              <div
                key={i}
                draggable={remaining > 0}
                onDragStart={e => remaining > 0 && handleDragStart(e, item)}
                onTouchStart={e => remaining > 0 && handleTouchStart(e, item)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  background: remaining > 0 ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.2)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 12, padding: '12px 16px',
                  cursor: remaining > 0 ? 'grab' : 'not-allowed',
                  opacity: remaining > 0 ? 1 : 0.4,
                  transition: 'all 0.2s',
                  minWidth: 70,
                }}
              >
                <Shape type={item.type} size={item.size} color={item.color} displaySize={1} />
                <div style={{ fontSize: 11, color: '#5B8DEF', fontWeight: 600 }}>вес: {item.weight}</div>
                <div style={{ fontSize: 10, color: '#5B7A94' }}>×{remaining}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Touch drag ghost */}
      {touchDragItem && (
        <div style={{
          position: 'fixed', left: touchPos.x - 20, top: touchPos.y - 20,
          pointerEvents: 'none', zIndex: 1000, opacity: 0.8,
        }}>
          <Shape type={touchDragItem.type} size={touchDragItem.size} color={touchDragItem.color} displaySize={1.2} />
        </div>
      )}

      {/* Solved overlay */}
      {solved && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(15,25,35,0.9)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          zIndex: 100,
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>⚖️</div>
          <div style={{
            fontSize: 28, fontWeight: 700, color: '#4ADE80', marginBottom: 8,
            textShadow: '0 0 20px rgba(74,222,128,0.4)',
          }}>
            Баланс!
          </div>
          <div style={{ fontSize: 14, color: '#8B9DAF', marginBottom: 24 }}>
            {leftMoment} = {rightMoment}
          </div>
          {currentLevel < LEVELS.length - 1 ? (
            <button onClick={nextLevel} style={{
              padding: '12px 32px', borderRadius: 12,
              background: 'linear-gradient(135deg, #5B8DEF, #4A6FD4)',
              border: 'none', color: '#fff', fontSize: 16, fontWeight: 600,
              cursor: 'pointer', boxShadow: '0 4px 20px rgba(91,141,239,0.4)',
            }}>
              Следующий уровень →
            </button>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, color: '#4ADE80', marginBottom: 8 }}>
                🎉 Все уровни пройдены!
              </div>
              <button onClick={() => setCurrentLevel(0)} style={{
                padding: '10px 24px', borderRadius: 12,
                background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                color: '#E2E8F0', fontSize: 14, cursor: 'pointer',
              }}>
                Играть снова
              </button>
            </div>
          )}
        </div>
      )}

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body, #root { margin: 0; padding: 0; background: #0F1923; min-height: 100vh; }
      `}</style>
    </div>
  );
};

export default Balancerio;
