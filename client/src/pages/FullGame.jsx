import { useEffect, useState } from 'react';

function FullGame() {
  const [gameId, setGameId] = useState(null);
  const [stack, setStack] = useState([]);
  const [guessCard, setGuessCard] = useState(null);
  const [guessIndex, setGuessIndex] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [correct, setCorrect] = useState(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [timeOut, setTimeOut] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [outcome, setOutcome] = useState(null);
  const [roundNumber, setRoundNumber] = useState(1);
  const [summary, setSummary] = useState(null);
  const [starting, setStarting] = useState(true);
  const [lives, setLives] = useState(3);
  const [waitingForNext, setWaitingForNext] = useState(false);

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

  useEffect(() => {
    if (gameId !== null) return;
    fetch('http://localhost:3001/api/games', { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        setGameId(data.gameId);
        const ordered = [...data.starterCards].sort((a, b) => a.bad_luck_index - b.bad_luck_index);
        setStack(ordered);
        setStarting(false);
      });
  }, [gameId]);

  useEffect(() => {
    if (!gameId) return;
    fetch(`http://localhost:3001/api/games/${gameId}/next`, { method: 'POST' })
      .then(res => res.json())
      .then(data => setGuessCard(data.guessCard));
  }, [gameId]);

  useEffect(() => {
    if (submitted || timeOut || gameOver || waitingForNext) return;
    if (timeLeft <= 0) {
      setTimeOut(true);
      handleSubmit(); // force submit on timeout
      return;
    }
    const timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, submitted, timeOut, gameOver, waitingForNext]);

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
    setCorrect(result.result === 'correct');
    if (result.result !== 'correct') setLives(prev => prev - 1);

    setSubmitted(true);
    setRoundNumber(prev => prev + 1);
    setGameOver(result.gameOver);
    setOutcome(result.outcome);

    if (lives - (result.result === 'correct' ? 0 : 1) <= 0) {
      setGameOver(true);
      setOutcome('loss');
      const res = await fetch(`http://localhost:3001/api/games/${gameId}/summary`);
      const data = await res.json();
      setSummary(data);
      return;
    }

    if (result.result === 'correct') {
      const full = [...stack, { ...guessCard, bad_luck_index: result.actualValue }];
      full.sort((a, b) => a.bad_luck_index - b.bad_luck_index);
      setStack(full);
    }

    if (result.gameOver) {
      const res = await fetch(`http://localhost:3001/api/games/${gameId}/summary`);
      const data = await res.json();
      setSummary(data);
    } else {
      setWaitingForNext(true); // wait for player confirmation
    }
  };

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
    <div style={{ textAlign: 'center', paddingTop: '2rem' }}>
      {starting && <h2>⏳ Starting new game...</h2>}

      {!starting && (
        <>
          <h1>🎮 Full Game Mode</h1>

          {!gameOver && (
            <>
              <h2>⏱ Time left: {timeLeft}</h2>
              <h2>🧩 Round {roundNumber}</h2>
              {timeOut && <p style={{ color: 'red' }}>Time’s up!</p>}

              <div style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
                {Array.from({ length: lives }).map((_, i) => <span key={i}>❤️</span>)}
                {Array.from({ length: 3 - lives }).map((_, i) => <span key={i} style={{ opacity: 0.3 }}>❤️</span>)}
              </div>

              <h2>Your Current Cards</h2>
              <ul style={{ display: 'flex', justifyContent: 'center', listStyle: 'none', gap: '1rem' }}>
                {stack.map((card) => (
                  <li key={card.id} style={{ border: '1px solid #666', padding: '1rem' }}>
                    <img src={`http://localhost:3001/images/${card.image}`} alt={card.name} width={100} />
                    <p>{card.name}</p>
                    <small>{card.bad_luck_index}</small>
                  </li>
                ))}
              </ul>

              {guessCard && (
                <>
                  <h2>New Situation</h2>
                  <img src={`http://localhost:3001/images/${guessCard.image}`} alt={guessCard.name} width={100} />
                  <p>{guessCard.name}</p>

                  <select
                    value={guessIndex ?? ''}
                    onChange={(e) => setGuessIndex(parseInt(e.target.value))}
                    disabled={submitted || timeOut}
                  >
                    <option value="" disabled>Select position...</option>
                    {stack.map((_, i) => (
                      <option key={i} value={i}>{`Before card ${i + 1}`}</option>
                    ))}
                    <option value={stack.length}>After all cards</option>
                  </select>

                  <div style={{ marginTop: '1rem' }}>
                    <button onClick={handleSubmit} disabled={submitted || timeOut || guessIndex === null}>
                      Submit
                    </button>
                  </div>

                  {submitted && (
                    <>
                      <p>{correct ? '✅ Correct!' : '❌ Incorrect!'}</p>
                      {waitingForNext && (
                        <button
                          onClick={handleNextRound}
                          style={{ marginTop: '1rem', padding: '0.5rem 1.2rem', fontSize: '1rem' }}
                        >
                          ▶️ Next Round
                        </button>
                      )}
                    </>
                  )}
                </>
              )}
            </>
          )}

          {gameOver && summary && (
            <div style={{ marginTop: '2rem' }}>
              <h2>🏁 Game Over</h2>
              <p>You {summary.outcome === 'win' ? 'won 🎉' : 'lost 😓'} the game!</p>

              <h3>📋 Cards You Collected</h3>
              <div style={{
                display: 'flex',
                overflowX: 'auto',
                gap: '1rem',
                padding: '1rem',
                border: '1px solid #444',
                borderRadius: '8px',
                justifyContent: 'flex-start'
              }}>
                {summary.cards.map(card => (
                  <div key={card.id} style={{ minWidth: '180px', border: '1px solid #666', borderRadius: '8px', padding: '0.5rem' }}>
                    <img src={`http://localhost:3001/images/${card.image}`} alt={card.name} width={150} />
                    <p><strong>{card.name}</strong></p>
                    <p style={{ fontSize: '0.9rem' }}>Bad Luck Index: {card.bad_luck_index}</p>
                    {card.round_number === 0
                      ? <p style={{ color: 'goldenrod' }}>🟡 Starter Card</p>
                      : <p style={{ color: 'lightgreen' }}>✅ Won in Round {card.round_number}</p>}
                  </div>
                ))}
              </div>

              <button
                onClick={resetGame}
                style={{ marginTop: '1.5rem', padding: '0.7rem 1.5rem', fontSize: '1rem' }}
              >
                🔁 Start Again
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default FullGame;
