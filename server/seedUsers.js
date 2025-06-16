import bcrypt from 'bcrypt';
import { openDB } from './db.js';

const seedUsers = async () => {
  const db = await openDB();

  const users = [
    {
      username: 'faridmmz',
      email: 'faridmmz79@gmail.com',
      password: '1234'
    },
    {
      username: 'sinashariati',
      email: 'sina.shariati11@gmail.com',
      password: '123457'
    }
  ];

  for (const user of users) {
    const hash = await bcrypt.hash(user.password, 10);

    // Clear if already exists (safe for development)
    await db.run('DELETE FROM users WHERE username = ?', user.username);

    await db.run(
      'INSERT INTO users (username, email, name, password) VALUES (?, ?, ?, ?)',
      user.username,
      user.email,
      user.username, // using username as display name
      hash
    );
  }

  console.log('✅ Seeded users with proper username field');
};

seedUsers();
