import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

// Login form component to authenticate registered users
function LoginForm() {
  const { login } = useAuth(); // Access login function from AuthContext
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(''); // Stores any login error message
  const [loading, setLoading] = useState(false); // Prevents multiple submissions

  // Handles form submission for login
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password); // Attempt login with credentials
    } catch (err) {
      setError('Invalid credentials'); // Show error if login fails
    } finally {
      setLoading(false); // Reset loading state
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '200px',
        margin: 'auto'
      }}
    >
      <h3>🔐 Login</h3>

      {/* Username input */}
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
      />

      {/* Password input */}
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      {/* Submit button */}
      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>

      {/* Error display */}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </form>
  );
}

export default LoginForm;
