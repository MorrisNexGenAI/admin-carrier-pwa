// ==================== src/services/storage.js ====================
import { openDB, deleteDB } from 'idb';
import { cleanupOnVersionMismatch, forceDeleteDatabase } from './dbCleanup';

const DB_NAME = 'admin_carrier_db';
const DB_VERSION = 1;  // Keep at 1 - never increment this again
const STORES = {
  CONTENT: 'content',
  PENDING_USERS: 'pending_users',
  SETTINGS: 'settings',
  AUTH: 'auth',
};

// Clear/Delete the entire database
export async function clearDatabase() {
  return forceDeleteDatabase();
}

// Check and fix version mismatch before opening DB
async function checkDatabaseVersion() {
  return new Promise((resolve) => {
    const request = indexedDB.open(DB_NAME);
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      const currentVersion = db.version;
      db.close();
      
      // If stored version is higher than expected, delete it
      if (currentVersion > DB_VERSION) {
        console.warn(`Database version mismatch: stored=${currentVersion}, expected=${DB_VERSION}`);
        indexedDB.deleteDatabase(DB_NAME).onsuccess = () => {
          console.log('Old database deleted, will create fresh');
          resolve(true);
        };
      } else {
        resolve(false);
      }
    };
    
    request.onerror = () => {
      resolve(false); // Database doesn't exist yet
    };
  });
}

// Initialize database with automatic error recovery
export async function initDB() {
  try {
    // First check if we need to delete old version
    await checkDatabaseVersion();
    
    const db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
        console.log(`[Storage] Upgrading database from version ${oldVersion} to ${newVersion}`);
        
        // Delete old stores if they exist
        const storeNames = Array.from(db.objectStoreNames);
        storeNames.forEach(name => {
          if (db.objectStoreNames.contains(name)) {
            db.deleteObjectStore(name);
            console.log(`[Storage] Deleted old store: ${name}`);
          }
        });
        
        // Create content store
        db.createObjectStore(STORES.CONTENT);
        console.log('[Storage] Created CONTENT store');
        
        // Create pending users store
        const pendingStore = db.createObjectStore(STORES.PENDING_USERS, { 
          keyPath: 'id', 
          autoIncrement: true 
        });
        pendingStore.createIndex('code', 'code', { unique: false });
        pendingStore.createIndex('synced', 'synced', { unique: false });
        console.log('[Storage] Created PENDING_USERS store');
        
        // Create settings store
        db.createObjectStore(STORES.SETTINGS);
        console.log('[Storage] Created SETTINGS store');
        
        // Create auth store
        db.createObjectStore(STORES.AUTH);
        console.log('[Storage] Created AUTH store');
      },
    });
    
    // Verify stores were created
    const storeNames = Array.from(db.objectStoreNames);
    console.log('[Storage] Available stores:', storeNames);
    
    const requiredStores = [STORES.CONTENT, STORES.PENDING_USERS, STORES.SETTINGS, STORES.AUTH];
    for (const store of requiredStores) {
      if (!storeNames.includes(store)) {
        throw new Error(`${store} store was not created properly`);
      }
    }
    
    return db;
  } catch (error) {
    console.error('[Storage] Database initialization error:', error);
    
    // Handle version mismatch or store creation errors
    if (error.message?.includes('higher version') ||
        error.message?.includes('not a known object store') || 
        error.message?.includes('version') ||
        error.message?.includes('store was not created')) {
      
      console.warn('[Storage] Forcing database recreation...');
      
      try {
        // Force delete and recreate
        await forceDeleteDatabase();
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Retry opening with fresh database
        return await openDB(DB_NAME, DB_VERSION, {
          upgrade(db) {
            db.createObjectStore(STORES.CONTENT);
            const pendingStore = db.createObjectStore(STORES.PENDING_USERS, { 
              keyPath: 'id', 
              autoIncrement: true 
            });
            pendingStore.createIndex('code', 'code', { unique: false });
            pendingStore.createIndex('synced', 'synced', { unique: false });
            db.createObjectStore(STORES.SETTINGS);
            db.createObjectStore(STORES.AUTH);
            console.log('[Storage] Database recreated successfully');
          },
        });
      } catch (retryError) {
        console.error('[Storage] Failed to recreate database:', retryError);
        throw new Error('Database initialization failed. Please refresh the page.');
      }
    }
    
    throw error;
  }
}

// ========== CONTENT STORAGE ==========

export async function saveContent(data) {
  try {
    const db = await initDB();
    
    if (!db.objectStoreNames.contains(STORES.CONTENT)) {
      throw new Error('CONTENT store does not exist in database');
    }
    
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
    console.log('[Storage] Content saved successfully');
    return true;
  } catch (error) {
    console.error('[Storage] Error saving content:', error);
    throw error;
  }
}

export async function getContent(key) {
  try {
    const db = await initDB();
    return await db.get(STORES.CONTENT, key);
  } catch (error) {
    console.error(`[Storage] Error getting content for key ${key}:`, error);
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
    console.error('[Storage] Error getting all content:', error);
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
    console.log('[Storage] Content cleared successfully');
  } catch (error) {
    console.error('[Storage] Error clearing content:', error);
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
    console.log('[Storage] Pending user added:', id);
    return id;
  } catch (error) {
    console.error('[Storage] Error adding pending user:', error);
    throw error;
  }
}

export async function getPendingUsers() {
  try {
    const db = await initDB();
    const users = await db.getAllFromIndex(STORES.PENDING_USERS, 'synced', 0);
    return users;
  } catch (error) {
    console.error('[Storage] Error getting pending users:', error);
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
    console.log('[Storage] Users marked as synced:', userIds);
  } catch (error) {
    console.error('[Storage] Error marking users as synced:', error);
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
    console.log('[Storage] Synced users deleted');
  } catch (error) {
    console.error('[Storage] Error deleting synced users:', error);
    throw error;
  }
}

// ========== SETTINGS ==========

export async function saveSetting(key, value) {
  try {
    const db = await initDB();
    await db.put(STORES.SETTINGS, value, key);
    console.log(`[Storage] Setting saved: ${key}`);
  } catch (error) {
    console.error(`[Storage] Error saving setting ${key}:`, error);
    throw error;
  }
}

export async function getSetting(key) {
  try {
    const db = await initDB();
    return await db.get(STORES.SETTINGS, key);
  } catch (error) {
    console.error(`[Storage] Error getting setting ${key}:`, error);
    return null;
  }
}

// ========== AUTH STORAGE (PERSISTENT SESSION) ==========

/**
 * Save user session - persists across browser refreshes
 */
export async function saveUserSession(userData) {
  try {
    const db = await initDB();
    const sessionData = {
      ...userData,
      savedAt: Date.now(),
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
    };
    await db.put(STORES.AUTH, sessionData, 'user_session');
    console.log('[Storage] User session saved');
    return true;
  } catch (error) {
    console.error('[Storage] Error saving user session:', error);
    return false;
  }
}

/**
 * Get user session - returns null if expired
 */
export async function getUserSession() {
  try {
    const db = await initDB();
    const session = await db.get(STORES.AUTH, 'user_session');
    
    if (!session) {
      return null;
    }
    
    // Check if session expired
    if (session.expiresAt && Date.now() > session.expiresAt) {
      console.log('[Storage] Session expired, clearing...');
      await clearUserSession();
      return null;
    }
    
    return session;
  } catch (error) {
    console.error('[Storage] Error getting user session:', error);
    return null;
  }
}

/**
 * Clear user session - call this on logout
 */
export async function clearUserSession() {
  try {
    const db = await initDB();
    await db.delete(STORES.AUTH, 'user_session');
    console.log('[Storage] User session cleared');
    return true;
  } catch (error) {
    console.error('[Storage] Error clearing user session:', error);
    return false;
  }
}

/**
 * Check if user is logged in
 */
export async function isUserLoggedIn() {
  const session = await getUserSession();
  return session !== null;
}

// Legacy auth functions (keep for compatibility)
export async function saveAuthToken(token) {
  try {
    const db = await initDB();
    await db.put(STORES.AUTH, token, 'token');
    console.log('[Storage] Auth token saved');
  } catch (error) {
    console.error('[Storage] Error saving auth token:', error);
    throw error;
  }
}

export async function getAuthToken() {
  try {
    const db = await initDB();
    return await db.get(STORES.AUTH, 'token');
  } catch (error) {
    console.error('[Storage] Error getting auth token:', error);
    return null;
  }
}

export async function clearAuthToken() {
  try {
    const db = await initDB();
    const tx = db.transaction(STORES.AUTH, 'readwrite');
    await tx.store.clear();
    await tx.done;
    console.log('[Storage] Auth token cleared');
  } catch (error) {
    console.error('[Storage] Error clearing auth token:', error);
    throw error;
  }
}

// Deprecated - use saveUserSession instead
export async function saveSession(sessionData) {
  return saveUserSession(sessionData);
}

// Deprecated - use getUserSession instead
export async function getSession() {
  return getUserSession();
}

// Deprecated - use clearUserSession instead
export async function clearSession() {
  return clearUserSession();
}

// ========== UTILITY FUNCTIONS ==========

export async function getDatabaseInfo() {
  try {
    const db = await initDB();
    const info = {
      name: DB_NAME,
      version: DB_VERSION,
      stores: Array.from(db.objectStoreNames),
    };
    console.log('[Storage] Database info:', info);
    return info;
  } catch (error) {
    console.error('[Storage] Error getting database info:', error);
    return null;
  }
}

export async function resetDatabase() {
  try {
    await clearDatabase();
    await initDB();
    console.log('[Storage] Database reset complete');
    return true;
  } catch (error) {
    console.error('[Storage] Error resetting database:', error);
    return false;
  }
}