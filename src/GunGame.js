// src/GunGame.js
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import GunGameUI from './GunGameUI';  // Import the new UI component (adjust path as needed)

/**
 * GunGame Component: Manages the core game engine, including state, logic, and game loop.
 * Renders GunGameUI and passes necessary props for UI rendering.
 */
function GunGame() {
  // State Management: Game variables and stats
  const [circles, setCircles] = useState([]);
  const [projectiles, setProjectiles] = useState([]);
  const [kills, setKills] = useState(0);
  const [level, setLevel] = useState(1);
  const [currentWeapon, setCurrentWeapon] = useState('Pistol');
  const [gameOver, setGameOver] = useState(false);
  const [isSpawning, setIsSpawning] = useState(true);
  const [lives, setLives] = useState(3);
  const [isRespawning, setIsRespawning] = useState(false);
  const [showPlayer, setShowPlayer] = useState(true);
  const [shotsAvailable, setShotsAvailable] = useState(5);
  const [shotsFired, setShotsFired] = useState(0);
  const [shotsHit, setShotsHit] = useState(0);
  const [gameStartTime, setGameStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [leaderboard, setLeaderboard] = useState([]);
  const [powerUps, setPowerUps] = useState([]);
  const [activePowerUps, setActivePowerUps] = useState({});

  // Refs: For mutable values and DOM access
  const killsRef = useRef(kills);
  const reloadQueueRef = useRef([]);
  const isImmune = useRef(false);
  const blinkIntervalRef = useRef(null);
  const gameAreaRef = useRef(null);  // Ref for game area DOM element, used in logic
  const gameLoopRef = useRef(null);
  const circlesRef = useRef([]);
  const projectilesRef = useRef([]);
  const powerUpsRef = useRef([]);
  const projectileId = useRef(0);
  const timerRef = useRef(null);
  const powerUpId = useRef(0);

  // Memoized Data: Weapon and circle configurations
  const weapons = useMemo(() => ({
    Pistol: { fireRate: 1500 },
    Shotgun: { fireRate: 1500, burst: 5 },
  }), []);

  const circleTypes = useMemo(() => ({
    large: { size: 30, points: 1, color: 'red' },
    medium: { size: 20, points: 2, color: 'orange' },
    small: { size: 12, points: 5, color: 'yellow' }
  }), []);

  // Effect: Load leaderboard from localStorage on mount
  useEffect(() => {
    const savedLeaderboard = localStorage.getItem('gunGameLeaderboard');
    if (savedLeaderboard) {
      setLeaderboard(JSON.parse(savedLeaderboard));
    }
  }, []);

  // Effect: Manage game timer
  useEffect(() => {
    if (gameStartTime && !gameOver && !isRespawning) {
      timerRef.current = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - gameStartTime) / 1000));
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [gameStartTime, gameOver, isRespawning]);

  // Utility Functions: State updaters with ref synchronization
  const updateCircles = (newCircles) => {
    circlesRef.current = newCircles;
    setCircles(newCircles);
  };

  const updateProjectiles = (newProjectiles) => {
    projectilesRef.current = newProjectiles;
    setProjectiles(newProjectiles);
  };

  const updatePowerUps = (newPowerUps) => {
    powerUpsRef.current = newPowerUps;
    setPowerUps(newPowerUps);
  };

  // Game Logic Functions
  const spawnCircles = useCallback((num, type = 'large') => {
    const newCircles = [];
    const gameArea = gameAreaRef.current;
    if (!gameArea) return;
    const rect = gameArea.getBoundingClientRect();
    const playerX = rect.width / 2;
    const playerY = rect.height / 2;
    const playerRadius = 10;
    const circleSize = circleTypes[type].size;

    for (let i = 0; i < num; i++) {
      let attempts = 0;
      let validPosition = false;
      let x, y;

      while (!validPosition && attempts < 50) {
        x = Math.random() * (rect.width - circleSize * 2) + circleSize;
        y = Math.random() * (rect.height - circleSize * 2) + circleSize;
        const distToPlayer = Math.sqrt(Math.pow(x - playerX, 2) + Math.pow(y - playerY, 2));
        if (distToPlayer > playerRadius + circleSize + 50) validPosition = true;
        attempts++;
      }

      if (validPosition) {
        const dx = (Math.random() - 0.5) * 2;
        const dy = (Math.random() - 0.5) * 2;
        const isSpecial = type === 'small' && Math.random() < 0.05;
        newCircles.push({ 
          x, y, dx, dy, size: circleSize,
          type: type,
          points: circleTypes[type].points,
          color: circleTypes[type].color,
          isSpecial: isSpecial,
          specialStartTime: isSpecial ? Date.now() : null,
          specialDuration: 5000
        });
      }
    }
    updateCircles(newCircles);
    setIsSpawning(false);
  }, [circleTypes]);

  const splitCircle = useCallback((circle) => {
    const gameArea = gameAreaRef.current;
    if (!gameArea) return [];
    const rect = gameArea.getBoundingClientRect();
    const newCircles = [];
    let newType;
    if (circle.type === 'large') newType = 'medium';
    else if (circle.type === 'medium') newType = 'small';
    else return [];
    const newSize = circleTypes[newType].size;
    for (let i = 0; i < 2; i++) {
      const angle = (Math.PI * 2 * i) / 2 + Math.random() * 0.5;
      const speed = 2 + Math.random();
      const dx = Math.cos(angle) * speed;
      const dy = Math.sin(angle) * speed;
      const offsetX = Math.cos(angle) * 15;
      const offsetY = Math.sin(angle) * 15;
      const isSpecial = newType === 'small' && Math.random() < 0.05;
      newCircles.push({
        x: Math.max(newSize, Math.min(circle.x + offsetX, rect.width - newSize)),
        y: Math.max(newSize, Math.min(circle.y + offsetY, rect.height - newSize)),
        dx, dy, size: newSize,
        type: newType,
        points: circleTypes[newType].points,
        color: circleTypes[newType].color,
        isSpecial: isSpecial,
        specialStartTime: isSpecial ? Date.now() : null,
        specialDuration: 5000
      });
    }
    return newCircles;
  }, [circleTypes]);

  const dropPowerUp = useCallback((x, y) => {
    const newPowerUp = {
      id: powerUpId.current++,
      x: x,
      y: y,
      type: 'shotgun',
      spawnTime: Date.now(),
      duration: 10000,
      justDropped: true
    };
    updatePowerUps([...powerUpsRef.current, newPowerUp]);
  }, []);

  const activatePowerUp = useCallback((powerUpType) => {
    if (powerUpType === 'shotgun') {
      setActivePowerUps(prev => ({
        ...prev,
        shotgun: {
          startTime: Date.now(),
          duration: 10000
        }
      }));
    }
  }, []);

  const startBlinking = () => {
    let blinkSpeed = 500;
    let elapsed = 0;
    let visible = false;

    const blink = () => {
      visible = !visible;
      setShowPlayer(visible);
      elapsed += blinkSpeed;

      if (elapsed >= 5000) {
        setShowPlayer(true);
        isImmune.current = false;
        return;
      }

      blinkSpeed = blinkSpeed * 0.88;
      blinkSpeed = Math.max(100, blinkSpeed);
      blinkIntervalRef.current = setTimeout(blink, blinkSpeed);
    };

    blink();
  };

  const submitHighScore = () => {
    if (!playerName.trim()) return;
    
    const newEntry = {
      name: playerName.trim(),
      score: killsRef.current,
      accuracy: shotsFired > 0 ? ((shotsHit / shotsFired) * 100).toFixed(1) : 0,
      time: elapsedTime,
      level: level,
      date: new Date().toLocaleDateString()
    };

    const updatedLeaderboard = [...leaderboard, newEntry]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    setLeaderboard(updatedLeaderboard);
    localStorage.setItem('gunGameLeaderboard', JSON.stringify(updatedLeaderboard));
    setShowNamePrompt(false);
    setPlayerName('');
  };

  // Core Game Loop: Handles updates, collisions, and game state
  const gameLoop = useCallback(() => {
    const checkForHighScore = () => {
      const finalScore = killsRef.current;
      if (leaderboard.length < 10 || finalScore > leaderboard[leaderboard.length - 1]?.score) {
        setShowNamePrompt(true);
      }
    };

    const gameArea = gameAreaRef.current;
    if (!gameArea || gameOver || isRespawning) return;
    const rect = gameArea.getBoundingClientRect();
    const playerX = rect.width / 2;
    const playerY = rect.height / 2;
    const playerRadius = 10;
    const movedProjectiles = projectilesRef.current
      .map(p => ({ ...p, x: p.x + p.dx, y: p.y + p.dy }))
      .filter(p => p.x >= 0 && p.x <= rect.width && p.y >= 0 && p.y <= rect.height);
    
    const movedCircles = circlesRef.current.map(circle => {
      let newX = circle.x + circle.dx;
      let newY = circle.y + circle.dy;
      if (newX - circle.size < 0 || newX + circle.size > rect.width) circle.dx = -circle.dx;
      if (newY - circle.size < 0 || newY + circle.size > rect.height) circle.dy = -circle.dy;
      
      let updatedCircle = {
        ...circle,
        x: Math.max(circle.size, Math.min(newX, rect.width - circle.size)),
        y: Math.max(circle.size, Math.min(newY, rect.height - circle.size)),
      };
      
      if (updatedCircle.isSpecial && updatedCircle.specialStartTime) {
        const elapsed = Date.now() - updatedCircle.specialStartTime;
        if (elapsed > updatedCircle.specialDuration) {
          updatedCircle.isSpecial = false;
          updatedCircle.specialStartTime = null;
        }
      }
      
      return updatedCircle;
    });
    
    const currentTime = Date.now();
    const validPowerUps = powerUpsRef.current.filter(powerUp => {
      return currentTime - powerUp.spawnTime < powerUp.duration;
    });
    if (validPowerUps.length !== powerUpsRef.current.length) {
      updatePowerUps(validPowerUps);
    }
    
    setActivePowerUps(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(key => {
        const powerUp = updated[key];
        if (currentTime - powerUp.startTime > powerUp.duration) {
          delete updated[key];
        }
      });
      return updated;
    });
    
    let totalPoints = 0;
    const survivingCircles = [];
    const usedProjectileIds = new Set();
    const newSplitCircles = [];
    let hitsThisFrame = 0;
    
    movedCircles.forEach(circle => {
      let hit = false;
      for (const p of movedProjectiles) {
        const dx = p.x - circle.x;
        const dy = p.y - circle.y;
        if (Math.sqrt(dx * dx + dy * dy) < circle.size + p.size) {
          hit = true;
          usedProjectileIds.add(p.id);
          hitsThisFrame++;
          break;
        }
      }
      if (hit) {
        totalPoints += circle.points;
        if (circle.isSpecial && circle.specialStartTime) {
          dropPowerUp(circle.x, circle.y);
        }
        const splitResults = splitCircle(circle);
        newSplitCircles.push(...splitResults);
      } else {
        survivingCircles.push(circle);
      }
    });
    
    const survivingPowerUps = [];
    powerUpsRef.current.forEach(powerUp => {
      let collected = false;
      if (!powerUp.justDropped) {
        for (const p of movedProjectiles) {
          const dx = p.x - powerUp.x;
          const dy = p.y - powerUp.y;
          if (Math.sqrt(dx * dx + dy * dy) < 15 + p.size) {
            collected = true;
            usedProjectileIds.add(p.id);
            activatePowerUp(powerUp.type);
            hitsThisFrame++;
            break;
          }
        }
      }
      if (!collected) {
        survivingPowerUps.push(powerUp);
      }
    });
    survivingPowerUps.forEach(p => {
      if (p.justDropped) {
        p.justDropped = false;
      }
    });
    updatePowerUps(survivingPowerUps);

    if (hitsThisFrame > 0) {
      setShotsHit(prev => prev + hitsThisFrame);
    }

    const playerHit = survivingCircles.some(circle => {
      const dx = circle.x - playerX;
      const dy = circle.y - playerY;
      return Math.sqrt(dx * dx + dy * dy) < circle.size + playerRadius;
    });
    if (playerHit && !isImmune.current) {
      isImmune.current = true;
      setIsRespawning(true);
      setShowPlayer(false);

      setTimeout(() => {
        setLives(prev => {
          const newLives = prev - 1;
          if (newLives <= 0) {
            setGameOver(true);
            checkForHighScore();
          } else {
            setShowPlayer(true);
            startBlinking();
          }
          return newLives;
        });
        setIsRespawning(false);
      }, 2000);
    }

    const remainingProjectiles = movedProjectiles.filter(p => !usedProjectileIds.has(p.id));
    const allCircles = [...survivingCircles, ...newSplitCircles];
    updateCircles(allCircles);
    updateProjectiles(remainingProjectiles);
    if (totalPoints > 0) setKills(k => k + totalPoints);
    if (allCircles.length === 0 && !isSpawning) {
      setIsSpawning(true);
      setLevel(prev => prev + 1);
      setKills(k => k + 25);
    }
  }, [gameOver, splitCircle, isSpawning, isRespawning, leaderboard, dropPowerUp, activatePowerUp]);

  // Handler: Process firing projectiles
  const handleFire = (event) => {
    if (shotsAvailable <= 0 || gameOver || isRespawning) return;

    if (!gameStartTime) {
      setGameStartTime(Date.now());
    }

    const rect = gameAreaRef.current.getBoundingClientRect();
    const playerX = rect.width / 2;
    const playerY = rect.height / 2;
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;
    const angle = Math.atan2(clickY - playerY, clickX - playerX);
    const weapon = weapons[currentWeapon];

    const isShotgunActive = activePowerUps.shotgun && 
      (Date.now() - activePowerUps.shotgun.startTime) < activePowerUps.shotgun.duration;

    const newProjectiles = [];

    if (isShotgunActive) {
      const spreadAngles = [-0.3, -0.15, 0, 0.15, 0.3];
      spreadAngles.forEach(spreadAngle => {
        const projectileAngle = angle + spreadAngle;
        newProjectiles.push({
          id: projectileId.current++,
          x: playerX, y: playerY,
          dx: Math.cos(projectileAngle) * 8,
          dy: Math.sin(projectileAngle) * 8,
          size: 6
        });
      });
    } else {
      newProjectiles.push({
        id: projectileId.current++,
        x: playerX, y: playerY,
        dx: Math.cos(angle) * 8,
        dy: Math.sin(angle) * 8,
        size: 6
      });
    }

    updateProjectiles([...projectilesRef.current, ...newProjectiles]);
    setShotsAvailable(prev => prev - 1);
    setShotsFired(prev => prev + newProjectiles.length);

    const reloadTimeout = setTimeout(() => {
      setShotsAvailable(prev => Math.min(prev + 1, 5));
      reloadQueueRef.current = reloadQueueRef.current.filter(id => id !== reloadTimeout);
    }, weapon.fireRate);

    reloadQueueRef.current.push(reloadTimeout);
  };

  // Utility: Format time for display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handler: Reset game state for restart
  const restartGame = () => {
    setCircles([]);
    setProjectiles([]);
    setKills(0);
    setLevel(1);
    setCurrentWeapon('Pistol');
    setGameOver(false);
    setIsSpawning(true);
    setLives(3);
    setIsRespawning(false);
    setShowPlayer(true);
    setShotsAvailable(5);
    setPowerUps([]);
    setActivePowerUps({});
    setShotsFired(0);
    setShotsHit(0);
    setGameStartTime(null);
    setElapsedTime(0);
    setShowNamePrompt(false);
    setPlayerName('');
    circlesRef.current = [];
    projectilesRef.current = [];
    powerUpsRef.current = [];
    projectileId.current = 0;
    powerUpId.current = 0;
    isImmune.current = false;
    reloadQueueRef.current.forEach(clearTimeout);
    reloadQueueRef.current = [];
    if (blinkIntervalRef.current) {
      clearTimeout(blinkIntervalRef.current);
      blinkIntervalRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // Effects: Manage game loop, spawning, and cleanup
  useEffect(() => {
    gameLoopRef.current = setInterval(gameLoop, 30);
    return () => clearInterval(gameLoopRef.current);
  }, [gameLoop]);

  useEffect(() => {
    if (gameOver) clearInterval(gameLoopRef.current);
  }, [gameOver]);

  useEffect(() => {
    if (!gameOver && level > 0) {
      const timeout = setTimeout(() => {
        spawnCircles(level * 5, 'large');
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [level, gameOver, spawnCircles]);

  useEffect(() => {
    return () => {
      clearInterval(gameLoopRef.current);
      clearInterval(blinkIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    return () => {
      reloadQueueRef.current.forEach(clearTimeout);
    };
  }, []);

  useEffect(() => {
    killsRef.current = kills;
  }, [kills]);

  // Render: Pass props to UI component
  return (
    <GunGameUI
      circles={circles}
      projectiles={projectiles}
      kills={kills}
      level={level}
      currentWeapon={currentWeapon}
      gameOver={gameOver}
      lives={lives}
      showPlayer={showPlayer}
      shotsFired={shotsFired}
      shotsHit={shotsHit}
      elapsedTime={elapsedTime}
      showNamePrompt={showNamePrompt}
      playerName={playerName}
      leaderboard={leaderboard}
      powerUps={powerUps}
      activePowerUps={activePowerUps}
      isRespawning={isRespawning}
      gameAreaRef={gameAreaRef}  // Pass ref for attachment in UI
      handleFire={handleFire}
      restartGame={restartGame}
      setPlayerName={setPlayerName}
      submitHighScore={submitHighScore}
      formatTime={formatTime}
    />
  );
}

export default GunGame;