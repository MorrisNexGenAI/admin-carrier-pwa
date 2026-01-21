import { apiClient } from './apiClient';
import { saveUserSession, getUserSession, clearUserSession } from './storage';
import { performLogout } from './dbCleanup';

/**
 * Utility: wrap a promise with timeout
 */
async function withTimeout(promise, ms, fallback) {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(fallback), ms);
    promise
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch(() => {
        clearTimeout(timer);
        resolve(fallback);
      });
  });
}

/**
 * Login to Django backend
 */
export async function loginAdmin(username, password) {
  try {
    const response = await withTimeout(
      apiClient.post("/auth/login/", { username, password }),
      15000, // 15s timeout for mobile
      { data: { success: false, error: "Timeout or network error" } }
    );

    if (!response.data.success) {
      return { success: false, error: response.data.error };
    }

    const session = {
      username: response.data.username,
      userId: response.data.user_id,
      isAdmin: response.data.is_admin ?? true,
      loggedInAt: Date.now(),
    };

    await saveUserSession(session);
    console.log('[Auth] Login successful');
    return { success: true, session };
  } catch (err) {
    console.error('[Auth] Login error:', err);
    return { success: false, error: "Network or server error" };
  }
}

/**
 * Logout - cleans up everything
 */
export async function logoutAdmin() {
  try {
    console.log('[Auth] Starting logout...');
    await withTimeout(apiClient.post('/auth/logout/'), 10000, null);
    await performLogout();
    console.log('[Auth] Logout complete');
    return true;
  } catch (err) {
    console.error('[Auth] Logout error:', err);
    await performLogout();
    return false;
  }
}

/**
 * Get current session from IndexedDB safely
 */
export async function getAuthSession() {
  try {
    const session = await withTimeout(getUserSession(), 5000, null);
    return session;
  } catch (err) {
    console.warn('[Auth] getAuthSession failed:', err);
    return null;
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated() {
  const session = await getAuthSession();
  return session !== null;
}

/**
 * Verify session with backend safely
 */
export async function verifySession() {
  try {
    const response = await withTimeout(apiClient.get('/auth/me/'), 10000, null);
    if (!response || !response.data) return false;

    if (response.data.authenticated) {
      // Update session with fresh data
      await saveUserSession({
        username: response.data.username,
        userId: response.data.user_id,
        isAdmin: response.data.is_admin ?? true,
        loggedInAt: Date.now(),
      });
      return true;
    }

    // Session invalid, clear it
    await clearUserSession();
    return false;
  } catch (err) {
    console.warn('[Auth] verifySession error:', err.message || err);
    if (err.response?.status === 401 || err.response?.status === 403) {
      await clearUserSession();
      return false;
    }
    // Network error: fallback to false for safety on mobile
    return false;
  }
}
