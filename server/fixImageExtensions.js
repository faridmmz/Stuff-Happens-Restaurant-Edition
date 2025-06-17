// Import the database helper to open a connection
import { openDB } from './db.js';

// Function to update all image filenames in the cards table to follow the format "01.png", "02.png", etc.
const fixImageExtensions = async () => {
  const db = await openDB(); // Open the SQLite database

  try {
    // Update each card's image filename based on its ID (e.g., id 1 -> "01.png", id 12 -> "12.png")
    await db.run("UPDATE cards SET image = printf('%02d.png', id)");
    console.log("All image filenames updated to .png successfully!");
  } catch (err) {
    console.error("Failed to update image filenames:", err);
  } finally {
    // Always close the database connection
    await db.close();
  }
};

// Call the function to perform the update
fixImageExtensions();
