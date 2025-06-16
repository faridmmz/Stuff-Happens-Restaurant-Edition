// imports
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import { openDB } from './db.js';
import './auth.js';
import passport from 'passport';

// init express
const app = express();
const port = 3001;

// middlewares
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

app.use(session({
  secret: 'yourSecretKeyHere',
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // ✅ already present, but double check


// serve card images
app.use('/images', express.static('CardsImages'));

// GET /api/cards/demo: demo game for anonymous users
app.get('/api/cards/demo', async (req, res) => {
  try {
    const db = await openDB();

    // get 4 random cards
    const cards = await db.all('SELECT * FROM cards ORDER BY RANDOM() LIMIT 4');

    const startCards = cards.slice(0, 3).sort((a, b) => a.bad_luck_index - b.bad_luck_index);
    const guessCard = { ...cards[3] };
    delete guessCard.bad_luck_index; // hide it from the player

    res.json({ startCards, guessCard });
  } catch (err) {
    console.error('Error in /api/cards/demo:', err);
    res.status(500).json({ error: 'Failed to load demo cards' });
  }
});

// activate the server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
app.post('/api/cards/check-guess', async (req, res) => {
  const { guessIndex, startIndices, guessCardId } = req.body;

  if (
    typeof guessIndex !== 'number' ||
    !Array.isArray(startIndices) ||
    typeof guessCardId !== 'number'
  ) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  try {
    const db = await openDB();

    // Get real bad luck index of the guess card
    const card = await db.get('SELECT bad_luck_index FROM cards WHERE id = ?', guessCardId);

    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    const full = [...startIndices, card.bad_luck_index].sort((a, b) => a - b);
    const correctIndex = full.indexOf(card.bad_luck_index);

    res.json({
      correct: guessIndex === correctIndex,
      trueIndex: correctIndex,
      actualValue: card.bad_luck_index
    });
  } catch (err) {
    console.error('Error in /api/cards/check-guess:', err);
    res.status(500).json({ error: 'Internal error' });
  }
});

app.post('/api/games', async (req, res) => {
  try {
    const db = await openDB();

    // TEMP: Fake user ID = 1 (we'll fix this with real login later)
    const userId = 1;

    // Create a new game
    const now = new Date().toISOString();
    const gameRes = await db.run(
      'INSERT INTO games (user_id, start_time) VALUES (?, ?)',
      userId,
      now
    );

    const gameId = gameRes.lastID;

    // Select 3 unique random cards
    const starterCards = await db.all('SELECT * FROM cards ORDER BY RANDOM() LIMIT 3');

    // Insert them into the rounds table (round_number 0)
    await Promise.all(
      starterCards.map((card, index) =>
        db.run(
          'INSERT INTO rounds (game_id, round_number, card_id, won) VALUES (?, ?, ?, ?)',
          gameId,
          0,
          card.id,
          1
        )
      )
    );

    // Send back the new game ID and starter cards
    res.json({ gameId, starterCards });
  } catch (err) {
    console.error('Error in /api/games:', err);
    res.status(500).json({ error: 'Failed to start a new game' });
  }
});

app.get('/api/games/current', async (req, res) => {
  try {
    const db = await openDB();
    const userId = 1; // 🔐 TEMP: hardcoded for now

    // Find latest active game
    const game = await db.get(`
      SELECT * FROM games
      WHERE user_id = ? AND outcome IS NULL
      ORDER BY start_time DESC
      LIMIT 1
    `, userId);

    if (!game) {
      return res.status(404).json({ error: 'No active game found' });
    }

    // Get all won cards from that game (user's current stack)
    const currentCards = await db.all(`
      SELECT c.*
      FROM rounds r
      JOIN cards c ON r.card_id = c.id
      WHERE r.game_id = ? AND r.won = 1
      ORDER BY c.bad_luck_index ASC
    `, game.id);

    // Count failed rounds
    const wrongGuesses = await db.get(`
      SELECT COUNT(*) as count
      FROM rounds
      WHERE game_id = ? AND won = 0
    `, game.id);

    res.json({
      gameId: game.id,
      currentCards,
      roundCount: currentCards.length,
      wrongGuesses: wrongGuesses.count
    });
  } catch (err) {
    console.error('Error in /api/games/current:', err);
    res.status(500).json({ error: 'Failed to fetch current game' });
  }
});

app.post('/api/games/:id/next', async (req, res) => {
  try {
    const db = await openDB();
    const gameId = parseInt(req.params.id);

    // Get all previously used card IDs in this game
    const used = await db.all(
      'SELECT card_id FROM rounds WHERE game_id = ?',
      gameId
    );
    const usedIds = used.map(row => row.card_id);

    // Select one random unused card
    let placeholder = '0'; // fallback for SQL injection safety
    const questionMarks = usedIds.map(() => '?').join(', ') || placeholder;
    const card = await db.get(
      `SELECT id, name, image FROM cards WHERE id NOT IN (${questionMarks}) ORDER BY RANDOM() LIMIT 1`,
      usedIds
    );

    if (!card) {
      return res.status(404).json({ error: 'No more cards available' });
    }

    res.json({ guessCard: card });
  } catch (err) {
    console.error('Error in /api/games/:id/next:', err);
    res.status(500).json({ error: 'Failed to fetch next card' });
  }
});
app.post('/api/games/:id/rounds', async (req, res) => {
  const db = await openDB();
  const gameId = parseInt(req.params.id);
  const { cardId, guessIndex, startIndices } = req.body;

  if (
    typeof cardId !== 'number' ||
    typeof guessIndex !== 'number' ||
    !Array.isArray(startIndices)
  ) {
    return res.status(400).json({ error: 'Invalid input data' });
  }

  try {
    // Get the real bad luck index of the card
    const card = await db.get('SELECT bad_luck_index FROM cards WHERE id = ?', cardId);

    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    // Determine actual position
    const allIndices = [...startIndices, card.bad_luck_index].sort((a, b) => a - b);
    const correctIndex = allIndices.indexOf(card.bad_luck_index);
    const won = guessIndex === correctIndex ? 1 : 0;

    const lastRound = await db.get(
  'SELECT MAX(round_number) as max FROM rounds WHERE game_id = ?',
      gameId
    );
    const roundNumber = (lastRound?.max || 0) + 1;




    // Insert round
    await db.run(
      'INSERT INTO rounds (game_id, round_number, card_id, won, guessed_position) VALUES (?, ?, ?, ?, ?)',
      gameId,
      roundNumber,
      cardId,
      won,
      guessIndex
    );

    // Count total wins and fails so far
    const winRes = await db.get(
      'SELECT COUNT(*) as count FROM rounds WHERE game_id = ? AND won = 1',
      gameId
    );
    const loseRes = await db.get(
      'SELECT COUNT(*) as count FROM rounds WHERE game_id = ? AND won = 0',
      gameId
    );

    let outcome = null;
    if (winRes.count >= 6) outcome = 'win';
    if (loseRes.count >= 3) outcome = 'loss';

    // If game over, update outcome
    if (outcome) {
      await db.run(
        'UPDATE games SET outcome = ?, end_time = ? WHERE id = ?',
        outcome,
        new Date().toISOString(),
        gameId
      );
    }

    res.json({
      result: won ? 'correct' : 'wrong',
      correctIndex,
      actualValue: card.bad_luck_index,
      gameOver: !!outcome,
      outcome: outcome || null
    });
  } catch (err) {
    console.error('Error in /api/games/:id/rounds:', err);
    res.status(500).json({ error: 'Failed to evaluate guess' });
  }
});

// LOGIN
app.post('/api/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ error: info?.message || 'Unauthorized' });

    req.logIn(user, (err) => {
      if (err) return next(err);
      return res.json({ user });
    });
  })(req, res, next);
});


// LOGOUT
app.get('/api/logout', (req, res) => {
  req.logout(() => {
    res.status(200).json({ message: 'Logged out' });
  });
});

// SESSION CHECK
app.get('/api/session', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ user: req.user });
  } else {
    res.status(401).json({ error: 'Not logged in' });
  }
});

app.get('/api/games/:id/summary', async (req, res) => {
  try {
    const db = await openDB();
    const gameId = parseInt(req.params.id);

    const cards = await db.all(`
      SELECT r.round_number, c.*
      FROM rounds r
      JOIN cards c ON r.card_id = c.id
      WHERE r.game_id = ? AND r.won = 1
      ORDER BY r.round_number ASC
    `, gameId);

    const game = await db.get('SELECT outcome FROM games WHERE id = ?', gameId);

    res.json({
      outcome: game?.outcome || null,
      cards
    });
  } catch (err) {
    console.error('Error in /api/games/:id/summary:', err);
    res.status(500).json({ error: 'Failed to fetch game summary' });
  }
});
