import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import DemoGame from './pages/DemoGame';
import FullGame from './pages/FullGame'; // You’ll make this next!
import ProtectedRoute from './components/ProtectedRoute'; // 👈 new import

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/demo" element={<DemoGame />} />
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
