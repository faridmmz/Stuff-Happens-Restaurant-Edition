import { openDB } from './db.js';

const fixImageExtensions = async () => {
  const db = await openDB();
  try {
    // Update all card image filenames to use .png based on their ID
    await db.run("UPDATE cards SET image = printf('%02d.png', id)");
    console.log("All image filenames updated to .png successfully!");
  } catch (err) {
    console.error("Failed to update image filenames:", err);
  } finally {
    await db.close();
  }
};

fixImageExtensions();
