import { openDB } from './db.js';
import fs from 'fs/promises';

const seedCards = async () => {
  const db = await openDB();

  // Read the properly structured JSON
  const file = await fs.readFile('./Cards_converted.json', 'utf-8');
  const cards = JSON.parse(file);

  // Clear existing cards (optional for dev)
  await db.run('DELETE FROM cards');

  // Insert all 100 cards
  await Promise.all(cards.map(card =>
    db.run(
      'INSERT INTO cards (id, name, image, bad_luck_index) VALUES (?, ?, ?, ?)',
      card.id, card.name, card.image, card.bad_luck_index
    )
  ));

  console.log('✅ Seeded cards from Cards_converted.json');
  await db.close();
};

seedCards();
