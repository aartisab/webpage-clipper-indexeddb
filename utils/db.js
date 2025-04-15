/**
 * IndexedDB utility for the Webpage Clipper extension
 * Handles database creation, connection, and CRUD operations
 */

const DB_NAME = 'WebpageClipperDB';
const DB_VERSION = 2;
const STORE_NAME = 'clippedPages';

// Database connection
let db = null;

// Initialize the database
async function initDB() {
  const request = indexedDB.open(DB_NAME, DB_VERSION);
  
  // Handle database upgrade (called when DB is created or version changes)
  request.onupgradeneeded = (event) => {
    const db = event.target.result;
    
    // Create the object store (table) if it doesn't exist
    if (db.objectStoreNames.contains(STORE_NAME)) {
      const transaction = event.target.transaction;
      const store = transaction.objectStore(STORE_NAME);
    
      store.openCursor().onsuccess = function (e) {
        const cursor = e.target.result;
        if (cursor) {
          const data = cursor.value;
          if (!data.wordCount || !data.readingTime) {
            const text = data.content || '';
            const words = text.trim().split(/\s+/).filter(Boolean);
            data.wordCount = words.length;
            data.readingTime = Math.ceil(words.length / 200);
            cursor.update(data);
          }
          cursor.continue();
        }
      };
    }
  };
  
  try {
    db = await new Promise((resolve, reject) => {
      request.onsuccess = () => {
        resolve(request.result);
      };
      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}

// Add a new clipped page to the database
async function addClippedPage(pageData) {
  if (!db) {
    throw new Error('Database not initialized');
  }
  
  const text = pageData.content || '';
const words = text.trim().split(/\s+/).filter(Boolean);

const data = { 
  ...pageData,
  timestamp: pageData.timestamp || new Date().toISOString(),
  wordCount: words.length,
  readingTime: Math.ceil(words.length / 200)
};
  try {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(data);
    const result = await new Promise((resolve, reject) => {
      request.onsuccess = () => {
        resolve(request.result); // returns the generated id
      };
      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
    console.log('Page clipped successfully');
    return result;
  } catch (error) {
    console.error('Failed to clip page:', error);
    throw error;
  }
}

// Get all clipped pages from the database
async function getAllClippedPages() {
  if (!db) {
    throw new Error('Database not initialized');
  }
  
  try {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    const result = await new Promise((resolve, reject) => {
      request.onsuccess = () => {
        resolve(request.result);
      };
      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
    return result;
  } catch (error) {
    console.error('Failed to get clipped pages:', error);
    throw error;
  }
}

// Delete a specific clipped page by ID
async function deleteClippedPage(id) {
  if (!db) {
    throw new Error('Database not initialized');
  }
  
  try {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);
    await new Promise((resolve, reject) => {
      request.onsuccess = () => {
        resolve();
      };
      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
    console.log(`Page with ID ${id} deleted successfully`);
  } catch (error) {
    console.error('Failed to delete page:', error);
    throw error;
  }
}

// Clear all clipped pages from the database
async function clearAllClippedPages() {
  if (!db) {
    throw new Error('Database not initialized');
  }
  
  try {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();
    await new Promise((resolve, reject) => {
      request.onsuccess = () => {
        resolve();
      };
      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
    console.log('All pages cleared successfully');
  } catch (error) {
    console.error('Failed to clear pages:', error);
    throw error;
  }
}

// Export the API
window.WebpageClipperDB = {
  init: initDB,
  addPage: addClippedPage,
  getAllPages: getAllClippedPages,
  deletePage: deleteClippedPage,
  clearAllPages: clearAllClippedPages
};
