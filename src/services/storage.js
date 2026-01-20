// ==================== src/services/storage.js ====================
import { openDB, deleteDB } from 'idb';

const DB_NAME = 'admin_carrier_db';
const DB_VERSION = 2;  // ← Increment version to trigger upgrade
const STORES = {
  CONTENT: 'content',
  PENDING_USERS: 'pending_users',
  SETTINGS: 'settings',
  AUTH: 'auth',  // ← Add this
};

// Clear/Delete the entire database
export async function clearDatabase() {
  try {
    await deleteDB(DB_NAME);
    console.log('Database deleted successfully');
    return true;
  } catch (error) {
    console.error('Error deleting database:', error);
    throw error;
  }
}

// Initialize database with automatic error recovery
export async function initDB() {
  try {
    const db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
        console.log(`Upgrading database from version ${oldVersion} to ${newVersion}`);
        
        // Delete old stores if they exist to ensure clean slate
        const storeNames = Array.from(db.objectStoreNames);
        storeNames.forEach(name => {
          if (db.objectStoreNames.contains(name)) {
            db.deleteObjectStore(name);
            console.log(`Deleted old store: ${name}`);
          }
        });
        
        // Create content store
        db.createObjectStore(STORES.CONTENT);
        console.log('Created CONTENT store');
        
        // Create pending users store
        const pendingStore = db.createObjectStore(STORES.PENDING_USERS, { 
          keyPath: 'id', 
          autoIncrement: true 
        });
        pendingStore.createIndex('code', 'code', { unique: false });
        pendingStore.createIndex('synced', 'synced', { unique: false });
        console.log('Created PENDING_USERS store');
        
        // Create settings store
        db.createObjectStore(STORES.SETTINGS);
        console.log('Created SETTINGS store');
        
        // Create auth store  ← Add this
        db.createObjectStore(STORES.AUTH);
        console.log('Created AUTH store');
      },
    });
    
    // Verify stores were created
    const storeNames = Array.from(db.objectStoreNames);
    console.log('Available stores:', storeNames);
    
    const requiredStores = [STORES.CONTENT, STORES.PENDING_USERS, STORES.SETTINGS, STORES.AUTH];
    for (const store of requiredStores) {
      if (!storeNames.includes(store)) {
        throw new Error(`${store} store was not created properly`);
      }
    }
    
    return db;
  } catch (error) {
    console.error('Database initialization error:', error);
    
    // If there's any error, force a clean recreation
    if (error.message?.includes('not a known object store') || 
        error.message?.includes('version') ||
        error.message?.includes('store was not created')) {
      
      console.warn('Forcing database recreation...');
      
      try {
        // Delete the corrupted database
        await clearDatabase();
        
        // Wait a bit for deletion to complete
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Retry opening with fresh database
        return await openDB(DB_NAME, DB_VERSION, {
          upgrade(db) {
            // Create all stores fresh
            db.createObjectStore(STORES.CONTENT);
            console.log('Created CONTENT store (retry)');
            
            const pendingStore = db.createObjectStore(STORES.PENDING_USERS, { 
              keyPath: 'id', 
              autoIncrement: true 
            });
            pendingStore.createIndex('code', 'code', { unique: false });
            pendingStore.createIndex('synced', 'synced', { unique: false });
            console.log('Created PENDING_USERS store (retry)');
            
            db.createObjectStore(STORES.SETTINGS);
            console.log('Created SETTINGS store (retry)');
            
            db.createObjectStore(STORES.AUTH);  // ← Add this
            console.log('Created AUTH store (retry)');
          },
        });
      } catch (retryError) {
        console.error('Failed to recreate database:', retryError);
        throw new Error('Database initialization failed. Please clear your browser data and try again.');
      }
    }
    
    throw error;
  }
}

// ========== CONTENT STORAGE ==========
// ... (keep all your existing content functions)

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
// ... (keep all your existing pending users functions)

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
// ... (keep all your existing settings functions)

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

// ========== AUTH STORAGE (NEW) ==========

export async function saveAuthToken(token) {
  try {
    const db = await initDB();
    await db.put(STORES.AUTH, token, 'token');
    console.log('Auth token saved');
  } catch (error) {
    console.error('Error saving auth token:', error);
    throw error;
  }
}

export async function getAuthToken() {
  try {
    const db = await initDB();
    return await db.get(STORES.AUTH, 'token');
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}

export async function clearAuthToken() {
  try {
    const db = await initDB();
    const tx = db.transaction(STORES.AUTH, 'readwrite');
    await tx.store.clear();
    await tx.done;
    console.log('Auth token cleared');
  } catch (error) {
    console.error('Error clearing auth token:', error);
    throw error;
  }
}

export async function saveSession(sessionData) {
  try {
    const db = await initDB();
    await db.put(STORES.AUTH, sessionData, 'session');
    console.log('Session saved');
  } catch (error) {
    console.error('Error saving session:', error);
    throw error;
  }
}

export async function getSession() {
  try {
    const db = await initDB();
    return await db.get(STORES.AUTH, 'session');
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

export async function clearSession() {
  try {
    const db = await initDB();
    await db.delete(STORES.AUTH, 'session');
    console.log('Session cleared');
  } catch (error) {
    console.error('Error clearing session:', error);
    throw error;
  }
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
    console.log('Database info:', info);
    return info;
  } catch (error) {
    console.error('Error getting database info:', error);
    return null;
  }
}

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