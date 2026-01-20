// ==================== src/services/dbCleanup.js ====================
/**
 * Automatic database cleanup and version management
 * Handles automatic database reset on logout and version conflicts
 */

const DB_NAME = 'admin_carrier_db';
const CLEANUP_EVENTS = {
  LOGOUT: 'user_logout',
  VERSION_MISMATCH: 'version_mismatch',
  AUTH_EXPIRED: 'auth_expired',
};

/**
 * Force delete the database
 */
export async function forceDeleteDatabase() {
  return new Promise((resolve, reject) => {
    const deleteRequest = indexedDB.deleteDatabase(DB_NAME);
    
    deleteRequest.onsuccess = () => {
      console.log('[DB Cleanup] Database deleted successfully');
      resolve(true);
    };
    
    deleteRequest.onerror = (event) => {
      console.error('[DB Cleanup] Error deleting database:', event);
      reject(event);
    };
    
    deleteRequest.onblocked = () => {
      console.warn('[DB Cleanup] Database deletion blocked - attempting force close');
      // Try to close all connections
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    };
  });
}

/**
 * Clear all database data but keep structure
 */
export async function clearAllStores(db) {
  try {
    const storeNames = Array.from(db.objectStoreNames);
    const tx = db.transaction(storeNames, 'readwrite');
    
    for (const storeName of storeNames) {
      await tx.objectStore(storeName).clear();
      console.log(`[DB Cleanup] Cleared store: ${storeName}`);
    }
    
    await tx.done;
    console.log('[DB Cleanup] All stores cleared');
    return true;
  } catch (error) {
    console.error('[DB Cleanup] Error clearing stores:', error);
    throw error;
  }
}

/**
 * Cleanup on logout - deletes everything
 */
export async function cleanupOnLogout() {
  try {
    console.log('[DB Cleanup] Starting logout cleanup...');
    
    // Clear localStorage/sessionStorage auth data
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_session');
    localStorage.removeItem('sessionid');
    sessionStorage.clear();
    
    // Force delete the database
    await forceDeleteDatabase();
    
    console.log('[DB Cleanup] Logout cleanup complete');
    return true;
  } catch (error) {
    console.error('[DB Cleanup] Logout cleanup failed:', error);
    // Even if it fails, try to reload to force cleanup
    window.location.reload();
    return false;
  }
}

/**
 * Cleanup on version mismatch
 */
export async function cleanupOnVersionMismatch() {
  try {
    console.log('[DB Cleanup] Handling version mismatch...');
    await forceDeleteDatabase();
    
    // Wait for deletion to complete
    await new Promise(resolve => setTimeout(resolve, 300));
    
    console.log('[DB Cleanup] Version mismatch resolved');
    return true;
  } catch (error) {
    console.error('[DB Cleanup] Version cleanup failed:', error);
    return false;
  }
}

/**
 * Check if database exists
 */
export async function databaseExists() {
  try {
    const databases = await indexedDB.databases();
    return databases.some(db => db.name === DB_NAME);
  } catch (error) {
    // Fallback for browsers that don't support indexedDB.databases()
    return new Promise((resolve) => {
      const request = indexedDB.open(DB_NAME);
      request.onsuccess = () => {
        request.result.close();
        resolve(true);
      };
      request.onerror = () => resolve(false);
    });
  }
}

/**
 * Get database version
 */
export async function getDatabaseVersion() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME);
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      const version = db.version;
      db.close();
      resolve(version);
    };
    
    request.onerror = () => {
      resolve(0); // Database doesn't exist
    };
  });
}

/**
 * Automatic cleanup handler
 * Call this during app initialization
 */
export function initAutoCleanup() {
  // Listen for logout event
  window.addEventListener('beforeunload', (event) => {
    const isLoggingOut = sessionStorage.getItem('is_logging_out');
    if (isLoggingOut === 'true') {
      cleanupOnLogout();
    }
  });
  
  console.log('[DB Cleanup] Auto cleanup initialized');
}

/**
 * Mark logout in progress
 * Call this when user clicks logout
 */
export function markLogoutInProgress() {
  sessionStorage.setItem('is_logging_out', 'true');
}

/**
 * Clear logout marker
 * Call this after successful logout
 */
export function clearLogoutMarker() {
  sessionStorage.removeItem('is_logging_out');
}

/**
 * Complete logout flow with cleanup
 */
export async function performLogout() {
  try {
    console.log('[DB Cleanup] Starting complete logout flow...');
    
    // Mark logout in progress
    markLogoutInProgress();
    
    // Clear all auth data
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_session');
    localStorage.removeItem('sessionid');
    
    // Delete database
    await forceDeleteDatabase();
    
    // Clear session storage
    sessionStorage.clear();
    
    console.log('[DB Cleanup] Logout complete');
    return true;
  } catch (error) {
    console.error('[DB Cleanup] Logout failed:', error);
    // Force reload as fallback
    sessionStorage.clear();
    localStorage.clear();
    window.location.reload();
    return false;
  }
}

/**
 * Emergency cleanup - use when everything is broken
 */
export async function emergencyCleanup() {
  try {
    console.log('[DB Cleanup] EMERGENCY CLEANUP INITIATED');
    
    // Clear all storage
    localStorage.clear();
    sessionStorage.clear();
    
    // Delete database
    await forceDeleteDatabase();
    
    // Clear cookies (best effort)
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    
    console.log('[DB Cleanup] Emergency cleanup complete - reloading...');
    
    // Wait a bit then reload
    setTimeout(() => {
      window.location.href = '/';
    }, 500);
    
    return true;
  } catch (error) {
    console.error('[DB Cleanup] Emergency cleanup failed:', error);
    // Last resort - hard reload
    window.location.reload(true);
    return false;
  }
}

export default {
  forceDeleteDatabase,
  clearAllStores,
  cleanupOnLogout,
  cleanupOnVersionMismatch,
  databaseExists,
  getDatabaseVersion,
  initAutoCleanup,
  markLogoutInProgress,
  clearLogoutMarker,
  performLogout,
  emergencyCleanup,
  CLEANUP_EVENTS,
};