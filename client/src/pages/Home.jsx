import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoginForm from '../components/LoginForm';

function Home() {
  // Auth context: provides current user and auth actions
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();

  // Wait for session to be checked before rendering
  if (loading) return <p>Loading session...</p>;

  return (
    <div style={{ textAlign: 'center', paddingTop: '4rem' }}>
      <h1>🍽 Stuff Happens – Restaurant Edition</h1>

      {/* Show options for guests */}
      {!user && (
        <>
          <p>Try a one-round guest game or log in to play the full experience!</p>

          {/* Guest demo button */}
          <button
            onClick={() => navigate('/demo')}
            style={{ fontSize: '1.2rem', margin: '1rem', padding: '0.8rem 1.5rem' }}
          >
            👻 Try Demo
          </button>

          {/* Login form for registered users */}
          <LoginForm />
        </>
      )}

      {/* Show options for logged-in users */}
      {user && (
        <>
          <p>Welcome, {user.username}!</p>

          {/* Full game navigation */}
          <button
            onClick={() => navigate('/game')}
            style={{ fontSize: '1.2rem', margin: '1rem', padding: '0.8rem 1.5rem' }}
          >
            🎮 Play Full Game
          </button>

          {/* Logout and history navigation */}
          <button onClick={logout}>Logout</button>
          <button onClick={() => navigate('/history')}>
            📜 View Game History
          </button>
        </>
      )}
    </div>
  );
}

export default Home;
