// ==================== src/services/auth.js ====================
import { apiClient } from './apiClient';
import { openDB } from 'idb';

const DB_NAME = 'admin_carrier_db';
const AUTH_STORE = 'auth';

// Initialize auth database
async function getAuthDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(AUTH_STORE)) {
        db.createObjectStore(AUTH_STORE);
      }
    },
  });
}

// Login to Django backend
// src/services/auth.js
export async function loginAdmin(username, password) {
  try {
    const response = await apiClient.post("/api/auth/login/", {  // Changed
      username,
      password,
    });

    if (!response.data.success) {
      return { success: false, error: response.data.error };
    }

    const session = {
      username: response.data.username,
      loggedInAt: Date.now(),
    };

    const db = await getAuthDB();
    await db.put(AUTH_STORE, session, "session");

    return { success: true, session };
  } catch (err) {
    console.error('Login error:', err);
    return {
      success: false,
      error: err.response?.data?.error || "Network or server error",
    };
  }
}

export async function logoutAdmin() {
  try {
    await apiClient.post('/api/auth/logout/');  // Changed
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    const db = await getAuthDB();
    await db.delete(AUTH_STORE, 'session');
  }
}
// Get current session
export async function getAuthSession() {
  try {
    const db = await getAuthDB();
    const session = await db.get(AUTH_STORE, 'session');
    return session || null;
  } catch (error) {
    console.error('Get session error:', error);
    return null;
  }
}

