import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function GameHistory() {
  // State to store fetched history data
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch the authenticated user's game history from the server on mount
  useEffect(() => {
    fetch('http://localhost:3001/api/history', {
      credentials: 'include' // Include cookies/session
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then(data => {
        setHistory(data.history);
      })
      .catch(err => {
        console.error('Failed to load history:', err);
        setHistory([]); // fallback in case of failure
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding: '2rem' }}>
      <h1>📜 Game History</h1>

      {/* Navigation back to home */}
      <button onClick={() => navigate('/')}>
        🔙 Exit to Menu
      </button>

      {/* Loading indicator */}
      {loading && <p>Loading...</p>}

      {/* No games found */}
      {history.length === 0 && !loading && <p>No past games yet.</p>}

      {/* Game history listing */}
      {history.map((game, index) => (
        <div
          key={index}
          style={{
            marginBottom: '2rem',
            padding: '1rem',
            border: '1px solid #ccc',
            borderRadius: '8px'
          }}
        >
          <h3>🕓 {new Date(game.date).toLocaleString()}</h3>
          <p>
            Result: {game.outcome === 'win' ? '🏆 Win' : '💀 Loss'} | Cards Owned: {game.cardCount}
          </p>

          {/* Per-card details */}
          <ul>
            {game.cards.map((card, i) => (
              <li key={i}>
                {card.name} —{' '}
                {card.status === 'starter'
                  ? '🟡 Starter'
                  : card.status === 'won'
                  ? `✅ Won (Round ${card.round})`
                  : card.status === 'missed'
                  ? `⏰ Timeout (Round ${card.round})`
                  : `❌ Incorrect (Round ${card.round})`}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export default GameHistory;
