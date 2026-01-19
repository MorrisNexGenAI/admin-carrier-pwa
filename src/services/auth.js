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
export async function loginAdmin(username, password) {
  try {
    // Django admin login endpoint
    const response = await apiClient.post('/core/login/', {
      username,
      password,
    });

    if (response.data.success) {
      const session = {
        username,
        loggedInAt: Date.now(),
        csrfToken: response.data.csrf_token,
      };

      // Save session locally
      const db = await getAuthDB();
      await db.put(AUTH_STORE, session, 'session');

      return { success: true, session };
    }

    return { success: false, error: 'Invalid credentials' };
  } catch (error) {
    console.error('Login error:', error);
    return { 
      success: false, 
      error: error.response?.data?.error || 'Login failed. Check your connection.' 
    };
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

// Logout
export async function logoutAdmin() {
  try {
    await apiClient.post('/core/logout/');
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    const db = await getAuthDB();
    await db.delete(AUTH_STORE, 'session');
  }
}