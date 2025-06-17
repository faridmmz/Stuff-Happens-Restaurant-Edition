import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import DemoGame from './pages/DemoGame';
import FullGame from './pages/FullGame';
import ProtectedRoute from './components/ProtectedRoute';
import GameHistory from './pages/GameHistory';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public home page */}
        <Route path="/" element={<Home />} />

        {/* Protected history page - requires login */}
        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <GameHistory />
            </ProtectedRoute>
          }
        />

        {/* Public one-round demo game for guests */}
        <Route path="/demo" element={<DemoGame />} />

        {/* Protected full game route - requires login */}
        <Route
          path="/game"
          element={
            <ProtectedRoute>
              <FullGame />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
