import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcrypt';
import { openDB } from './db.js';

passport.use(new LocalStrategy(
  {
    usernameField: 'username', // ✅ use 'username' instead of 'email'
    passwordField: 'password'
  },
  async (username, password, done) => {
    try {
      const db = await openDB();
      const user = await db.get('SELECT * FROM users WHERE username = ?', username);

      if (!user) return done(null, false, { message: 'User not found' });

      const match = await bcrypt.compare(password, user.password);
      if (!match) return done(null, false, { message: 'Incorrect password' });

      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const db = await openDB();
    const user = await db.get('SELECT * FROM users WHERE id = ?', id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});
