// ==================== src/services/auth.js ====================
import { apiClient } from './apiClient';
import { saveUserSession, getUserSession, clearUserSession } from './storage';
import { performLogout } from './dbCleanup';

/**
 * Login to Django backend
 */
export async function loginAdmin(username, password) {
  try {
    const response = await apiClient.post("/auth/login/", {
      username,
      password,
    });

    if (!response.data.success) {
      return { success: false, error: response.data.error };
    }

    // Save session to IndexedDB (with 7-day expiration)
    const session = {
      username: response.data.username,
      userId: response.data.user_id,
      isAdmin: response.data.is_admin || true,
      loggedInAt: Date.now(),
    };

    await saveUserSession(session);

    console.log('[Auth] Login successful');
    return { success: true, session };
  } catch (err) {
    console.error('[Auth] Login error:', err);
    return {
      success: false,
      error: err.response?.data?.error || "Network or server error",
    };
  }
}

/**
 * Logout - cleans up everything
 */
export async function logoutAdmin() {
  try {
    console.log('[Auth] Starting logout...');

    // Call backend logout endpoint
    try {
      await apiClient.post('/auth/logout/');
    } catch (error) {
      console.warn('[Auth] Backend logout failed, continuing with local cleanup');
    }

    // Perform complete cleanup (IndexedDB, localStorage, etc.)
    await performLogout();

    console.log('[Auth] Logout complete');
    return true;
  } catch (error) {
    console.error('[Auth] Logout error:', error);
    // Force cleanup even on error
    await performLogout();
    return false;
  }
}

/**
 * Get current session from IndexedDB
 */
export async function getAuthSession() {
  try {
    const session = await getUserSession();
    return session;
  } catch (error) {
    console.error('[Auth] Get session error:', error);
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
 * Verify session with backend
 */
export async function verifySession() {
  try {
    const response = await apiClient.get('/auth/me/');
    
    if (response.data.authenticated) {
      // Update session with fresh data
      await saveUserSession({
        username: response.data.username,
        userId: response.data.user_id,
        isAdmin: response.data.is_admin || true,
        loggedInAt: Date.now(),
      });
      return true;
    }

    // Session invalid, clear it
    await clearUserSession();
    return false;
  } catch (error) {
    console.error('[Auth] Session verification failed:', error);
    // Don't clear session on network errors, only on 401/403
    if (error.response?.status === 401 || error.response?.status === 403) {
      await clearUserSession();
      return false;
    }
    // For network errors, assume session is still valid
    return true;
  }
}