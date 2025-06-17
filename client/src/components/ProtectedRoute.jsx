import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Component that protects routes from unauthenticated access
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth(); // Access auth state from context

  // While checking session status, show a loading message
  if (loading) return <p>Checking login status...</p>;

  // If user is not logged in, redirect to home
  if (!user) {
    return <Navigate to="/" />;
  }

  // If user is authenticated, allow access to the protected content
  return children;
}

export default ProtectedRoute;
