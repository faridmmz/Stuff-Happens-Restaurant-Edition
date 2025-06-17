import { createContext, useContext, useEffect, useState } from 'react';

// Create a context for authentication
const AuthContext = createContext();

// AuthProvider component wraps the app and provides auth state
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // Stores current user info
  const [loading, setLoading] = useState(true); // Tracks loading during session check

  // On mount: check if the user is already authenticated (via session)
  useEffect(() => {
    fetch('http://localhost:3001/api/session', {
      credentials: 'include' // Send cookies with request
    })
      .then(res => {
        if (res.ok) return res.json(); // If session exists, parse user
        throw new Error('Not logged in');
      })
      .then(data => {
        setUser(data.user); // Save user in state
      })
      .catch(() => setUser(null)) // No user if session fails
      .finally(() => setLoading(false)); // Done loading
  }, []);

  // Login function – sends username and password to the server
  const login = async (username, password) => {
    const res = await fetch('http://localhost:3001/api/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (!res.ok) throw new Error('Login failed');
    const data = await res.json();
    setUser(data.user); // Store logged-in user
  };

  // Logout function – ends session on server
  const logout = async () => {
    await fetch('http://localhost:3001/api/logout', {
      method: 'GET',
      credentials: 'include'
    });
    setUser(null); // Clear user from state
  };

  // Provide auth state and actions to the rest of the app
  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context easily
export function useAuth() {
  return useContext(AuthContext);
}
