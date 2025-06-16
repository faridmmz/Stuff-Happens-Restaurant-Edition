import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoginForm from '../components/LoginForm';

function Home() {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) return <p>Loading session...</p>;

  return (
    <div style={{ textAlign: 'center', paddingTop: '4rem' }}>
      <h1>🍽 Stuff Happens – Restaurant Edition</h1>

      {!user && (
        <>
          <p>Try a one-round guest game or log in to play the full experience!</p>
          <button onClick={() => navigate('/demo')} style={{ fontSize: '1.2rem', margin: '1rem', padding: '0.8rem 1.5rem' }}>
            👻 Try Demo
          </button>

          <LoginForm />
        </>
      )}

      {user && (
        <>
          <p>Welcome, {user.username}!</p>
          <button onClick={() => navigate('/game')} style={{ fontSize: '1.2rem', margin: '1rem', padding: '0.8rem 1.5rem' }}>
            🎮 Play Full Game
          </button>
          <button onClick={logout}>Logout</button>
        </>
      )}
    </div>
  );
}

export default Home;
