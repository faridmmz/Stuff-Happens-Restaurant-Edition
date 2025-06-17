import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcrypt';
import { openDB } from './db.js';

// Configure the local strategy for Passport authentication
passport.use(new LocalStrategy(
  {
    usernameField: 'username', // Field to use as username
    passwordField: 'password'  // Field to use as password
  },
  async (username, password, done) => {
    try {
      const db = await openDB();

      // Look up user by username in the database
      const user = await db.get('SELECT * FROM users WHERE username = ?', username);

      if (!user) {
        return done(null, false, { message: 'User not found' });
      }

      // Compare entered password with hashed password in database
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return done(null, false, { message: 'Incorrect password' });
      }

      // If credentials match, return the user
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }
));

// Serialize the user ID into the session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize the user ID from the session and retrieve the user
passport.deserializeUser(async (id, done) => {
  try {
    const db = await openDB();
    const user = await db.get('SELECT * FROM users WHERE id = ?', id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});
