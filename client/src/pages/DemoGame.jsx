import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function DemoGame() {
  // Game state
  const [startCards, setStartCards] = useState([]); // The 3 initial cards
  const [guessCard, setGuessCard] = useState(null); // The card to guess position of
  const [guessIndex, setGuessIndex] = useState(0);  // Selected index guess
  const [submitted, setSubmitted] = useState(false); // Whether the guess was submitted
  const [correct, setCorrect] = useState(null); // Whether the guess was correct
  const [timeLeft, setTimeLeft] = useState(30); // Countdown timer
  const [timeOut, setTimeOut] = useState(false); // If time ran out
  const navigate = useNavigate(); // For redirecting back to main menu

  // Load demo cards at start
  useEffect(() => {
    fetch('http://localhost:3001/api/cards/demo')
      .then(res => res.json())
      .then(data => {
        setStartCards(data.startCards);
        setGuessCard(data.guessCard);
      });
  }, []);

  // Countdown timer logic
  useEffect(() => {
    if (submitted) return; // Stop timer if already submitted
    if (timeLeft <= 0) {
      setTimeOut(true); // Mark time out if reaches 0
      return;
    }

    const timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearTimeout(timer); // Cleanup interval
  }, [timeLeft, submitted]);

  // Submit guess to server for evaluation
  const handleSubmit = async () => {
    if (guessCard && guessIndex !== null) {
      try {
        const response = await fetch('http://localhost:3001/api/cards/check-guess', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            guessIndex,
            startIndices: startCards.map(c => c.bad_luck_index),
            guessCardId: guessCard.id
          })
        });

        const result = await response.json();
        setCorrect(result.correct);
        setSubmitted(true);
      } catch (error) {
        console.error('Error checking guess:', error);
      }
    }
  };

  // Reset the demo game state and fetch new cards
  const resetDemo = () => {
    setSubmitted(false);
    setCorrect(null);
    setGuessIndex(0);
    setTimeLeft(30);
    setTimeOut(false);

    fetch('http://localhost:3001/api/cards/demo')
      .then(res => res.json())
      .then(data => {
        setStartCards(data.startCards);
        setGuessCard(data.guessCard);
      });
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      padding: '2rem',
      fontFamily: 'sans-serif',
      color: '#f0f0f0'
    }}>
      <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
        {/* LEFT INFO PANEL */}
        <div style={{ width: '240px', fontSize: '0.9rem', textAlign: 'left' }}>
          <h2 style={{ fontSize: '1.2rem' }}>👻 Demo Game</h2>
          <p>⏱️ Time left: {timeLeft}s</p>
          {timeOut && <p style={{ color: 'red' }}>⛔ Time’s up! You didn’t make a guess in time.</p>}
          <p style={{ marginTop: '1rem', fontWeight: 'bold' }}>Your Current Cards:</p>
        </div>

        {/* RIGHT MAIN GAME AREA */}
        <div style={{ flex: 1 }}>
          {/* Display the initial stack */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            flexWrap: 'wrap',
            marginBottom: '2rem'
          }}>
            {startCards.map((card, idx) => (
              <div key={idx} style={{
                border: '1px solid #666',
                borderRadius: '6px',
                padding: '0.5rem',
                textAlign: 'center',
                width: '150px',
                background: '#1f1f1f'
              }}>
                <img
                  src={`http://localhost:3001/images/${card.image}`}
                  alt={card.name}
                  width={100}
                />
                <p style={{ fontSize: '0.85rem' }}>{card.name}</p>
                <small style={{ fontSize: '0.75rem' }}>Bad Luck: {card.bad_luck_index}</small>
              </div>
            ))}
          </div>

          {/* GUESS CARD and interaction area */}
          {guessCard && (
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
              {/* LEFT: New card info */}
              <div style={{ textAlign: 'center' }}>
                <h3>New Situation</h3>
                <img src={`http://localhost:3001/images/${guessCard.image}`} alt={guessCard.name} width={100} />
                <p style={{ fontSize: '0.9rem' }}>{guessCard.name}</p>
              </div>

              {/* RIGHT: Select position and submit */}
              <div style={{ textAlign: 'left' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                  Guess its position:
                </label>
                <select
                  value={guessIndex}
                  onChange={e => setGuessIndex(parseInt(e.target.value))}
                  disabled={submitted || timeOut}
                  style={{ padding: '0.4rem', width: '100%', marginBottom: '1rem' }}
                >
                  {startCards.map((_, i) => (
                    <option key={i} value={i}>{`Before card ${i + 1}`}</option>
                  ))}
                  <option value={startCards.length}>After all cards</option>
                </select>

                <button
                  onClick={handleSubmit}
                  disabled={submitted || timeOut}
                  style={{ padding: '0.4rem 1rem' }}
                >
                  Submit
                </button>

                {/* Display result if submitted */}
                {submitted && (
                  <div style={{ marginTop: '1rem' }}>
                    {correct
                      ? <p style={{ color: 'lightgreen' }}>🎉 Correct! You guessed the right position!</p>
                      : <p style={{ color: 'salmon' }}>❌ Oops! That was not the correct spot.</p>
                    }
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Show action buttons after result or timeout */}
      {(submitted || timeOut) && (
        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
          <button
            onClick={resetDemo}
            style={{ padding: '0.5rem 1rem', fontSize: '1rem' }}
          >
            🔁 Try Again
          </button>
          <button
            onClick={() => navigate('/')}
            style={{ padding: '0.5rem 1rem', fontSize: '1rem' }}
          >
            🔙 Back to Menu
          </button>
        </div>
      )}
    </div>
  );
}

export default DemoGame;
