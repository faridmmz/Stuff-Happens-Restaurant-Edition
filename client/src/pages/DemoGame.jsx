import { useEffect, useState } from 'react';
import './DemoGame.css'; // optional for styling

function DemoGame() {
  const [startCards, setStartCards] = useState([]);
  const [guessCard, setGuessCard] = useState(null);
  const [guessIndex, setGuessIndex] = useState(0); // instead of null
  const [submitted, setSubmitted] = useState(false);
  const [correct, setCorrect] = useState(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [timeOut, setTimeOut] = useState(false);


  useEffect(() => {
    fetch('http://localhost:3001/api/cards/demo')
      .then(res => res.json())
      .then(data => {
        setStartCards(data.startCards);
        setGuessCard(data.guessCard);
      });
  }, []);

  useEffect(() => {
  if (submitted) return; // stop timer after submit
  if (timeLeft <= 0) {
    setTimeOut(true);
    return;
  }

  const timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);

  return () => clearTimeout(timer); // cleanup on unmount
}, [timeLeft, submitted]);


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


  return (
    <div>
      <h1>Demo Game</h1>
      <h3>⏱️ Time left: {timeLeft} seconds</h3>
      {timeOut && <p style={{ color: 'red' }}>⛔ Time's up! You didn’t make a guess in time.</p>}


      <h2>Your Current Cards</h2>
      <ul>
        {startCards.map((card, idx) => (
          <li key={idx}>
            <img src={`http://localhost:3001/images/${card.image}`} alt={card.name} width={100} />
            <p>{card.name} (Bad Luck: {card.bad_luck_index})</p>
          </li>
        ))}
      </ul>

      {guessCard && (
        <>
          <h2>New Situation</h2>
          <img src={`http://localhost:3001/images/${guessCard.image}`} alt={guessCard.name} width={100} />
          <p>{guessCard.name}</p>

          <label>
            Guess its position:
            <select
              value={guessIndex}
              onChange={e => setGuessIndex(parseInt(e.target.value))}
              disabled={submitted || timeOut}
            >

              {startCards.map((_, i) => (
                <option key={i} value={i}>{`Before card ${i + 1}`}</option>
              ))}
              <option value={startCards.length}>After all cards</option>
            </select>
          </label>

          <button onClick={handleSubmit} disabled={submitted || timeOut}>
            Submit
          </button>


          {submitted && (
            <div>
              {correct ? <p>🎉 Correct! You guessed the right position!</p> : <p>❌ Oops! That was not the correct spot.</p>}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default DemoGame;
