// src/GunGameUI.js
import React from 'react';
import './GunGame.css';

function GunGameUI({
  circles,
  projectiles,
  kills,
  level,
  currentWeapon,
  gameOver,
  lives,
  showPlayer,
  shotsFired,
  shotsHit,
  elapsedTime,
  showNamePrompt,
  playerName,
  leaderboard,
  powerUps,
  activePowerUps,
  isRespawning,
  gameAreaRef,
  handleFire,
  restartGame,
  setPlayerName,
  submitHighScore,
  formatTime
}) {
  return (
    <div className="gun-game">
      <h1>Gun Game</h1>
      {showNamePrompt && (
        <div className="name-prompt-overlay">
          <div className="name-prompt-content">
            <h2>High Score!</h2>
            <p>You made it to the top 10!</p>
            <p>Score: {kills} | Accuracy: {shotsFired > 0 ? ((shotsHit / shotsFired) * 100).toFixed(1) : 0}%</p>
            <input
              type="text"
              placeholder="Enter your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && submitHighScore()}
              className="name-input"
              maxLength={20}
              autoFocus
            />
            <br />
            <button
              onClick={submitHighScore}
              disabled={!playerName.trim()}
              className="submit-button"
            >
              Submit
            </button>
          </div>
        </div>
      )}
      
      {gameOver ? (
        <div className="game-over-container">
          <h2>Good Game!</h2>
          <div style={{ marginBottom: '20px' }}>
            <p><strong>Final Score:</strong> {kills}</p>
            <p><strong>Level Reached:</strong> {level}</p>
            <p><strong>Shots Fired:</strong> {shotsFired}</p>
            <p><strong>Shots Hit:</strong> {shotsHit}</p>
            <p><strong>Accuracy:</strong> {shotsFired > 0 ? ((shotsHit / shotsFired) * 100).toFixed(1) : 0}%</p>
            <p><strong>Time Played:</strong> {formatTime(elapsedTime)}</p>
          </div>
          
          {leaderboard.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h3>Leaderboard</h3>
              <div className="leaderboard-container">
                {leaderboard.map((entry, index) => (
                  <div key={index} className="leaderboard-entry">
                    <span>#{index + 1} {entry.name}</span>
                    <span>{entry.score} pts | {entry.accuracy}% | {formatTime(entry.time)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <button 
            onClick={restartGame}
            className="play-again-button"
          >
            Play Again
          </button>
        </div>
      ) : (
        <>
          <div className="hud">
            <div>Weapon: {currentWeapon} | Level: {level}</div>
            <div>Lives: {lives} | Score: {kills}</div>
          </div>

          <div className="stats-bar">
            <div className="stats-left">
                Accuracy: {shotsFired > 0 ? ((shotsHit / shotsFired) * 100).toFixed(1) : 0}% | 
                Time: {formatTime(elapsedTime)}
            </div>
            <div className={`powerup-box ${activePowerUps.shotgun ? 'powerup-active' : 'powerup-inactive'}`}>
                {activePowerUps.shotgun
                ? `SHOTGUN ACTIVE (${Math.ceil((activePowerUps.shotgun.duration - (Date.now() - activePowerUps.shotgun.startTime)) / 1000)}s)`
                : 'SHOTGUN INACTIVE'}
            </div>
          </div>

          <div className="legend">
            <strong>Scoring:</strong> Large (1pt) → Medium (2pt each) → Small (5pt each) | Level Clear: +25pts<br/>
            <strong>Power-ups:</strong> Purple blinking circles drop power-ups when hit!
          </div>

          <div
            className="game-area"
            ref={gameAreaRef}
            onClick={!isRespawning ? handleFire : undefined}
          >
            {/* Player */}
            {showPlayer && (
              <div
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  width: '20px',
                  height: '20px',
                  backgroundColor: 'blue',
                  borderRadius: '50%',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 1,
                }}
              />
            )}

            {circles.map((c, i) => {
              let circleColor = c.color;
              if (c.isSpecial && c.specialStartTime) {
                const elapsed = Date.now() - c.specialStartTime;
                const blinkInterval = 200;
                const shouldShowPurple = Math.floor(elapsed / blinkInterval) % 2 === 0;
                circleColor = shouldShowPurple ? 'purple' : c.color;
              }
              
              return (
                <div key={i} style={{
                  position: 'absolute',
                  left: c.x - c.size,
                  top: c.y - c.size,
                  width: c.size * 2,
                  height: c.size * 2,
                  borderRadius: '50%',
                  backgroundColor: circleColor,
                  border: '2px solid darkred'
                }} />
              );
            })}

            {powerUps.map((powerUp) => (
              <div key={powerUp.id} style={{
                position: 'absolute',
                left: powerUp.x - 15,
                top: powerUp.y - 15,
                width: 30,
                height: 30,
                backgroundColor: '#4CAF50',
                border: '3px solid #2E7D32',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 'bold',
                color: 'white',
                zIndex: 2
              }}>
                S
              </div>
            ))}

            {projectiles.map((p) => (
              <div key={p.id} style={{
                position: 'absolute',
                left: p.x - p.size,
                top: p.y - p.size,
                width: p.size * 2,
                height: p.size * 2,
                borderRadius: '50%',
                backgroundColor: 'black'
              }} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default GunGameUI;