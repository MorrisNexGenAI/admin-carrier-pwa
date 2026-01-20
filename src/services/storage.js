// ==================== src/services/storage.js ====================
import { openDB } from 'idb';

const DB_NAME = 'admin_carrier_db';
const DB_VERSION = 1;

const STORES = {
  CONTENT: 'content',
  PENDING_USERS: 'pending_users',
  SETTINGS: 'settings',
};

// Initialize database
export async function initDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion, transaction) {
      // Content store: departments, courses, topics
      if (!db.objectStoreNames.contains(STORES.CONTENT)) {
        db.createObjectStore(STORES.CONTENT);
      }

      // Pending users store
      if (!db.objectStoreNames.contains(STORES.PENDING_USERS)) {
        const store = db.createObjectStore(STORES.PENDING_USERS, { 
          keyPath: 'id', 
          autoIncrement: true 
        });
        store.createIndex('code', 'code', { unique: false });
        store.createIndex('synced', 'synced', { unique: false });
      }

      // Settings store
      if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
        db.createObjectStore(STORES.SETTINGS);
      }
    },
  });
}

// ========== CONTENT STORAGE ==========

export async function saveContent(data) {
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
  return true;
}

export async function getContent(key) {
  const db = await initDB();
  return db.get(STORES.CONTENT, key);
}

export async function getAllContent() {
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
}

export async function clearContent() {
  const db = await initDB();
  const tx = db.transaction(STORES.CONTENT, 'readwrite');
  await tx.store.clear();
  await tx.done;
}

// ========== PENDING USERS ==========

export async function addPendingUser(userData) {
  const db = await initDB();
  const user = {
    ...userData,
    synced: false,
    created_at: Date.now(),
  };
  return db.add(STORES.PENDING_USERS, user);
}

export async function getPendingUsers() {
  const db = await initDB();
  const users = await db.getAllFromIndex(STORES.PENDING_USERS, 'synced', 0);
  return users;
}

export async function markUsersSynced(userIds) {
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
}

export async function deleteSyncedUsers() {
  const db = await initDB();
  const allUsers = await db.getAll(STORES.PENDING_USERS);
  const tx = db.transaction(STORES.PENDING_USERS, 'readwrite');
  
  for (const user of allUsers) {
    if (user.synced) {
      await tx.store.delete(user.id);
    }
  }
  
  await tx.done;
}

// ========== SETTINGS ==========

export async function saveSetting(key, value) {
  const db = await initDB();
  await db.put(STORES.SETTINGS, value, key);
}

export async function getSetting(key) {
  const db = await initDB();
  return db.get(STORES.SETTINGS, key);
}

