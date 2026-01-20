// ==================== src/services/storage.js ====================
import { openDB } from 'idb';

const DB_NAME = 'admin_carrier_db';
const DB_VERSION = 1;
const STORES = {
  CONTENT: 'content',
  PENDING_USERS: 'pending_users',
  SETTINGS: 'settings',
};

// Clear/Delete the entire database
export async function clearDatabase() {
  return new Promise((resolve, reject) => {
    const deleteRequest = indexedDB.deleteDatabase(DB_NAME);
    
    deleteRequest.onsuccess = () => {
      console.log('Database deleted successfully');
      resolve();
    };
    
    deleteRequest.onerror = () => {
      console.error('Error deleting database:', deleteRequest.error);
      reject(deleteRequest.error);
    };
    
    deleteRequest.onblocked = () => {
      console.warn('Database deletion blocked - close all other tabs using this app');
      reject(new Error('Database deletion blocked'));
    };
  });
}

// Initialize database with automatic error recovery
export async function initDB() {
  try {
    return await openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
        console.log(`Upgrading database from version ${oldVersion} to ${newVersion}`);
        
        // Content store: departments, courses, topics
        if (!db.objectStoreNames.contains(STORES.CONTENT)) {
          db.createObjectStore(STORES.CONTENT);
          console.log('Created CONTENT store');
        }
        
        // Pending users store
        if (!db.objectStoreNames.contains(STORES.PENDING_USERS)) {
          const store = db.createObjectStore(STORES.PENDING_USERS, { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          store.createIndex('code', 'code', { unique: false });
          store.createIndex('synced', 'synced', { unique: false });
          console.log('Created PENDING_USERS store');
        }
        
        // Settings store
        if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
          db.createObjectStore(STORES.SETTINGS);
          console.log('Created SETTINGS store');
        }
      },
    });
  } catch (error) {
    // Handle version mismatch error
    if (error.message?.includes('higher version') || 
        error.name === 'VersionError' ||
        error.message?.includes('version')) {
      console.warn('Database version conflict detected - clearing and recreating database');
      
      try {
        // Delete the old database
        await clearDatabase();
        
        // Wait a bit for the deletion to complete
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Retry opening with fresh database
        return await openDB(DB_NAME, DB_VERSION, {
          upgrade(db) {
            // Create all stores fresh
            db.createObjectStore(STORES.CONTENT);
            
            const store = db.createObjectStore(STORES.PENDING_USERS, { 
              keyPath: 'id', 
              autoIncrement: true 
            });
            store.createIndex('code', 'code', { unique: false });
            store.createIndex('synced', 'synced', { unique: false });
            
            db.createObjectStore(STORES.SETTINGS);
            
            console.log('Database recreated successfully');
          },
        });
      } catch (retryError) {
        console.error('Failed to recreate database:', retryError);
        throw new Error('Please close all other tabs and refresh the page');
      }
    }
    
    // Re-throw other errors
    console.error('Database initialization error:', error);
    throw error;
  }
}

// ========== CONTENT STORAGE ==========

export async function saveContent(data) {
  try {
    const db = await initDB();
    const tx = db.transaction(STORES.CONTENT, 'readwrite');
    
    await tx.store.put(data.departments, 'departments');
    await tx.store.put(data.courses, 'courses');
    await tx.store.put(data.topics, 'topics');
    await tx.store.put(data.premium_users, 'premium_users');
    await tx.store.put({
      timestamp: data.sync_timestamp,
      total_topics: data.total_topics,
      total_users: data.total_users,
    }, 'sync_info');
    
    await tx.done;
    console.log('Content saved successfully');
    return true;
  } catch (error) {
    console.error('Error saving content:', error);
    throw error;
  }
}

export async function getContent(key) {
  try {
    const db = await initDB();
    return await db.get(STORES.CONTENT, key);
  } catch (error) {
    console.error(`Error getting content for key ${key}:`, error);
    return null;
  }
}

export async function getAllContent() {
  try {
    const db = await initDB();
    const [departments, courses, topics, premium_users, sync_info] = await Promise.all([
      db.get(STORES.CONTENT, 'departments'),
      db.get(STORES.CONTENT, 'courses'),
      db.get(STORES.CONTENT, 'topics'),
      db.get(STORES.CONTENT, 'premium_users'),
      db.get(STORES.CONTENT, 'sync_info'),
    ]);
    
    return {
      departments: departments || [],
      courses: courses || [],
      topics: topics || [],
      premium_users: premium_users || [],
      sync_info: sync_info || null,
    };
  } catch (error) {
    console.error('Error getting all content:', error);
    return {
      departments: [],
      courses: [],
      topics: [],
      premium_users: [],
      sync_info: null,
    };
  }
}

export async function clearContent() {
  try {
    const db = await initDB();
    const tx = db.transaction(STORES.CONTENT, 'readwrite');
    await tx.store.clear();
    await tx.done;
    console.log('Content cleared successfully');
  } catch (error) {
    console.error('Error clearing content:', error);
    throw error;
  }
}

// ========== PENDING USERS ==========

export async function addPendingUser(userData) {
  try {
    const db = await initDB();
    const user = {
      ...userData,
      synced: false,
      created_at: Date.now(),
    };
    const id = await db.add(STORES.PENDING_USERS, user);
    console.log('Pending user added:', id);
    return id;
  } catch (error) {
    console.error('Error adding pending user:', error);
    throw error;
  }
}

export async function getPendingUsers() {
  try {
    const db = await initDB();
    const users = await db.getAllFromIndex(STORES.PENDING_USERS, 'synced', 0);
    return users;
  } catch (error) {
    console.error('Error getting pending users:', error);
    return [];
  }
}

export async function markUsersSynced(userIds) {
  try {
    const db = await initDB();
    const tx = db.transaction(STORES.PENDING_USERS, 'readwrite');
    
    for (const id of userIds) {
      const user = await tx.store.get(id);
      if (user) {
        user.synced = true;
        user.synced_at = Date.now();
        await tx.store.put(user);
      }
    }
    
    await tx.done;
    console.log('Users marked as synced:', userIds);
  } catch (error) {
    console.error('Error marking users as synced:', error);
    throw error;
  }
}

export async function deleteSyncedUsers() {
  try {
    const db = await initDB();
    const allUsers = await db.getAll(STORES.PENDING_USERS);
    const tx = db.transaction(STORES.PENDING_USERS, 'readwrite');
    
    for (const user of allUsers) {
      if (user.synced) {
        await tx.store.delete(user.id);
      }
    }
    
    await tx.done;
    console.log('Synced users deleted');
  } catch (error) {
    console.error('Error deleting synced users:', error);
    throw error;
  }
}

// ========== SETTINGS ==========

export async function saveSetting(key, value) {
  try {
    const db = await initDB();
    await db.put(STORES.SETTINGS, value, key);
    console.log(`Setting saved: ${key}`);
  } catch (error) {
    console.error(`Error saving setting ${key}:`, error);
    throw error;
  }
}

export async function getSetting(key) {
  try {
    const db = await initDB();
    return await db.get(STORES.SETTINGS, key);
  } catch (error) {
    console.error(`Error getting setting ${key}:`, error);
    return null;
  }
}

// ========== UTILITY FUNCTIONS ==========

// Get database info for debugging
export async function getDatabaseInfo() {
  try {
    const db = await initDB();
    const info = {
      name: DB_NAME,
      version: DB_VERSION,
      stores: Array.from(db.objectStoreNames),
    };
    console.log('Database info:', info);
    return info;
  } catch (error) {
    console.error('Error getting database info:', error);
    return null;
  }
}

// Force database reset (useful for debugging)
export async function resetDatabase() {
  try {
    await clearDatabase();
    await initDB();
    console.log('Database reset complete');
    return true;
  } catch (error) {
    console.error('Error resetting database:', error);
    return false;
  }
}