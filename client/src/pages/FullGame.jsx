import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function FullGame() {
  // Core game state variables
  const [gameId, setGameId] = useState(null);
  const [stack, setStack] = useState([]); // Collected cards (sorted)
  const [guessCard, setGuessCard] = useState(null); // New card to place
  const [guessIndex, setGuessIndex] = useState(null); // Player's guess
  const [submitted, setSubmitted] = useState(false); // Whether guess is submitted
  const [correct, setCorrect] = useState(null); // Was the guess correct?
  const [timeLeft, setTimeLeft] = useState(30); // Timer per round
  const [timeOut, setTimeOut] = useState(false); // Did time run out?
  const [gameOver, setGameOver] = useState(false); // Is the game finished?
  const [outcome, setOutcome] = useState(null); // Final result: win/loss
  const [roundNumber, setRoundNumber] = useState(1); // Current round number
  const [summary, setSummary] = useState(null); // Final collected cards
  const [starting, setStarting] = useState(true); // Used while loading initial game
  const [lives, setLives] = useState(3); // Player lives
  const [waitingForNext, setWaitingForNext] = useState(false); // Waiting after guess
  const navigate = useNavigate();

  // Resets all state to start a new game
  const resetGame = () => {
    setStarting(true);
    setGameId(null);
    setStack([]);
    setGuessCard(null);
    setGuessIndex(null);
    setSubmitted(false);
    setCorrect(null);
    setTimeLeft(30);
    setTimeOut(false);
    setGameOver(false);
    setOutcome(null);
    setSummary(null);
    setRoundNumber(1);
    setLives(3);
    setWaitingForNext(false);
  };

  // Starts a new game session and gets starter cards
  useEffect(() => {
    if (gameId !== null) return;
    fetch('http://localhost:3001/api/games', {
      method: 'POST',
      credentials: 'include'
    })
      .then(res => {
        if (!res.ok) throw new Error('Game start failed');
        return res.json();
      })
      .then(data => {
        setGameId(data.gameId);
        // Sort initial stack by bad luck index
        const ordered = [...data.starterCards].sort((a, b) => a.bad_luck_index - b.bad_luck_index);
        setStack(ordered);
        setStarting(false);
      })
      .catch(err => {
        console.error('Failed to start game:', err);
        alert('⚠️ You must be logged in to play. Redirecting to home...');
        window.location.href = '/';
      });
  }, [gameId]);

  // Gets the next card to guess after game start or after submitting a round
  useEffect(() => {
    if (!gameId) return;
    fetch(`http://localhost:3001/api/games/${gameId}/next`, { method: 'POST' })
      .then(res => res.json())
      .then(data => setGuessCard(data.guessCard));
  }, [gameId]);

  // Timer countdown and timeout handler
  useEffect(() => {
    if (submitted || timeOut || gameOver || waitingForNext) return;

    if (timeLeft <= 0) {
      setTimeOut(true);

      if (guessIndex !== null) {
        handleSubmit(); // Submit current guess
      } else {
        // No guess made — save round as timeout
        fetch(`http://localhost:3001/api/games/${gameId}/rounds`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cardId: guessCard.id,
            guessIndex: null,
            startIndices: stack.map(c => c.bad_luck_index)
          })
        }).then(() => {
          setSubmitted(true);
          setWaitingForNext(true);
          setRoundNumber(prev => prev + 1);
          setLives(prev => prev - 1);

          // If no lives left, end game
          if (lives - 1 <= 0) {
            setGameOver(true);
            setOutcome('loss');
            fetch(`http://localhost:3001/api/games/${gameId}/summary`)
              .then(res => res.json())
              .then(data => setSummary(data));
          }
        });
      }

      return;
    }

    const timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearTimeout(timer); // Cleanup
  }, [timeLeft, submitted, timeOut, gameOver, waitingForNext]);

  // Submits player's guess and updates game state
  const handleSubmit = async () => {
    if (!guessCard || submitted || gameOver || guessIndex === null) return;

    const response = await fetch(`http://localhost:3001/api/games/${gameId}/rounds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cardId: guessCard.id,
        guessIndex,
        startIndices: stack.map(c => c.bad_luck_index)
      })
    });

    const result = await response.json();
    const isCorrect = result.result === 'correct';
    setCorrect(isCorrect);

    if (!isCorrect) setLives(prev => prev - 1);
    setSubmitted(true);
    setRoundNumber(prev => prev + 1);
    setGameOver(result.gameOver);
    setOutcome(result.outcome);

    // Check if out of lives
    if (lives - (isCorrect ? 0 : 1) <= 0) {
      setGameOver(true);
      setOutcome('loss');
      const res = await fetch(`http://localhost:3001/api/games/${gameId}/summary`);
      const data = await res.json();
      setSummary(data);
      return;
    }

    // If guess is correct, add card to stack and sort
    if (isCorrect) {
      const full = [...stack, { ...guessCard, bad_luck_index: result.actualValue }];
      full.sort((a, b) => a.bad_luck_index - b.bad_luck_index);
      setStack(full);
    }

    // If game is over, get summary
    if (result.gameOver) {
      const res = await fetch(`http://localhost:3001/api/games/${gameId}/summary`);
      const data = await res.json();
      setSummary(data);
    } else {
      setWaitingForNext(true);
    }
  };

  // Starts next round (gets new card)
  const handleNextRound = async () => {
    setTimeLeft(30);
    setTimeOut(false);
    setSubmitted(false);
    setCorrect(null);
    setGuessIndex(null);
    setWaitingForNext(false);

    const next = await fetch(`http://localhost:3001/api/games/${gameId}/next`, {
      method: 'POST'
    });
    const nextData = await next.json();
    setGuessCard(nextData.guessCard);
  };


  return (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    padding: '2rem',
    fontFamily: 'sans-serif',
    color: '#f0f0f0'
  }}>
    <div style={{ display: 'flex', alignItems: 'flex-start' }}>
      {/* LEFT INFO PANEL */}
      <div style={{ width: '260px', fontSize: '0.9rem', textAlign: 'left' }}>
        <h2 style={{ fontSize: '1.2rem' }}>🎮 Full Game Mode</h2>
        <p>⏱ Time left: {timeLeft}</p>
        <p>🧩 Round {roundNumber}</p>
        {timeOut && <p style={{ color: 'red' }}>⏰ Time’s up!</p>}
        <p>
          {Array.from({ length: lives }).map((_, i) => <span key={i}>❤️</span>)}
          {Array.from({ length: 3 - lives }).map((_, i) => (
            <span key={i} style={{ opacity: 0.3 }}>❤️</span>
          ))}
        </p>
        <p style={{ marginTop: '1rem', fontWeight: 'bold' }}>Your Current Cards:</p>
      </div>

      {/* RIGHT GAME AREA */}
      <div style={{ flex: 1 }}>
        {/* Card stack (only if game is ongoing) */}
        {!gameOver && (
          <div style={{
            display: 'flex',
            gap: '1rem',
            flexWrap: 'wrap',
            marginBottom: '2rem'
          }}>
            {stack.map((card) => (
              <div key={card.id} style={{
                border: '1px solid #666',
                borderRadius: '6px',
                padding: '0.5rem',
                textAlign: 'center',
                width: '150px',
                background: '#1f1f1f'
              }}>
                <img src={`http://localhost:3001/images/${card.image}`} alt={card.name} width={100} />
                <p style={{ fontSize: '0.85rem' }}>{card.name}</p>
                <p style={{ fontSize: '0.9rem' }}>Bad Luck Index: {card.bad_luck_index}</p>
              </div>
            ))}
          </div>
        )}

        {/* Summary cards (only if game is over) */}
        {gameOver && summary && (
  <>
    <h2 style={{ marginBottom: '0.5rem' }}>
      🏁 Game Over — You {summary.outcome === 'win' ? 'won 🎉' : 'lost 😓'}!
    </h2>

    <div style={{ margin: '1rem 0' }}>
      <button
        onClick={() => navigate('/')}
        style={{
          padding: '0.6rem 1.2rem',
          fontSize: '1rem',
          marginRight: '1rem'
        }}
      >
        🔙 Exit to Menu
      </button>
      <button
        onClick={resetGame}
        style={{
          padding: '0.6rem 1.2rem',
          fontSize: '1rem'
        }}
      >
        🔁 Start Again
      </button>
    </div>

    <h3 style={{ marginTop: '1.5rem' }}>📋 Cards You Collected</h3>

    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      justifyContent: 'flex-start',
      gap: '1rem',
      padding: '1rem',
      border: '1px solid #444',
      borderRadius: '8px',
      background: '#121212'
    }}>
      {summary.cards.map(card => (
        <div key={card.id} style={{
          width: '120px', // Smaller
          border: '1px solid #666',
          borderRadius: '8px',
          padding: '0.4rem',
          background: '#1a1a1a',
          textAlign: 'center'
        }}>
          <img
            src={`http://localhost:3001/images/${card.image}`}
            alt={card.name}
            width={100} 
          />
          <p style={{ fontSize: '0.75rem', margin: '0.4rem 0' }}><strong>{card.name}</strong></p>
          <p style={{ fontSize: '0.7rem', margin: 0 }}>Bad Luck Index: {card.bad_luck_index}</p>
          {card.round_number === 0
            ? <p style={{ color: 'goldenrod', fontSize: '0.7rem', marginTop: '0.3rem' }}>🟡 Starter Card</p>
            : <p style={{ color: 'lightgreen', fontSize: '0.7rem', marginTop: '0.3rem' }}>
                ✅ Won in Round {card.round_number}
              </p>}
        </div>
      ))}
    </div>
  </>
)}


        {/* New guess card (only if game is ongoing) */}
        {guessCard && !gameOver && (
          <div style={{
            marginTop: '1rem',
            padding: '1rem',
            border: '1px solid #444',
            borderRadius: '8px',
            backgroundColor: '#121212',
            display: 'flex',
            alignItems: 'center',
            gap: '2rem'
          }}>
            <div style={{ textAlign: 'center' }}>
              <h3>New Situation</h3>
              <img src={`http://localhost:3001/images/${guessCard.image}`} alt={guessCard.name} width={100} />
              <p style={{ fontSize: '0.9rem' }}>{guessCard.name}</p>
            </div>

            <div style={{ textAlign: 'left' }}>
              <select
                value={guessIndex ?? ''}
                onChange={(e) => setGuessIndex(parseInt(e.target.value))}
                disabled={submitted || timeOut}
                style={{ padding: '0.4rem', marginBottom: '0.5rem', width: '100%' }}
              >
                <option value="" disabled>Select position...</option>
                {stack.map((_, i) => (
                  <option key={i} value={i}>{`Before card ${i + 1}`}</option>
                ))}
                <option value={stack.length}>After all cards</option>
              </select>

              <div style={{ marginTop: '0.5rem' }}>
                <button
                  onClick={handleSubmit}
                  disabled={submitted || timeOut || guessIndex === null}
                  style={{ padding: '0.4rem 1rem' }}
                >
                  Submit
                </button>
              </div>

              {submitted && (
                <>
                  <p style={{ marginTop: '0.5rem' }}>
                    {correct ? '✅ Correct!' : '❌ Incorrect!'}
                  </p>
                  {waitingForNext && (
                    <button
                      onClick={handleNextRound}
                      style={{ marginTop: '0.5rem', padding: '0.4rem 1rem' }}
                    >
                      ▶️ Next Round
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
);



}

export default FullGame;
