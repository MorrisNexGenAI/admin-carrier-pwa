// ==================== package.json ====================
{
  "name": "admin-carrier-pwa",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "axios": "^1.6.0",
    "react-router-dom": "^6.20.0",
    "idb": "^8.0.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.0",
    "vite": "^5.0.0",
    "vite-plugin-pwa": "^0.17.0"
  }
}


// ==================== vite.config.js ====================
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icon-192.png', 'icon-512.png'],
      devOptions: {
        enabled: true,
      },
      manifest: {
        name: 'Admin Carrier - Study Companion',
        short_name: 'AdminCarrier',
        description: 'Offline content distribution hub for Study Companion',
        theme_color: '#f59e0b',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        orientation: 'portrait',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: /^http:\/\/192\.168\.\d+\.\d+:8080\/api\/.*/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'local-api-cache',
              networkTimeoutSeconds: 5,
            }
          }
        ]
      }
    })
  ],
  server: {
    port: 8080,
    host: '0.0.0.0', // Allow external connections
  }
});


// ==================== index.html ====================
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="theme-color" content="#f59e0b" />
  <link rel="icon" type="image/png" href="/icon-192.png" />
  <link rel="apple-touch-icon" href="/icon-192.png" />
  <title>Admin Carrier - Study Companion</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>


// ==================== public/manifest.json ====================
{
  "name": "Admin Carrier - Study Companion",
  "short_name": "AdminCarrier",
  "description": "Offline content distribution hub",
  "theme_color": "#f59e0b",
  "background_color": "#ffffff",
  "display": "standalone",
  "scope": "/",
  "start_url": "/",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}


// ==================== src/main.jsx ====================
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/app.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);


// ==================== src/App.jsx ====================
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import SettingsPage from './pages/SettingsPage';
import { getAuthSession } from './services/auth';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const session = await getAuthSession();
    setIsAuthenticated(!!session);
    setLoading(false);
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px',
        color: '#f59e0b'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/login" 
          element={isAuthenticated ? <Navigate to="/" /> : <LoginPage onLogin={checkAuth} />} 
        />
        <Route 
          path="/" 
          element={isAuthenticated ? <DashboardPage /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/settings" 
          element={isAuthenticated ? <SettingsPage /> : <Navigate to="/login" />} 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;


// ==================== src/services/apiClient.js ====================
import axios from 'axios';

const DJANGO_URL = import.meta.env.VITE_DJANGO_URL || 'https://your-backend.onrender.com';

export const apiClient = axios.create({
  baseURL: DJANGO_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for Django session cookies
  timeout: 30000,
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('Unauthorized - clearing session');
      localStorage.removeItem('admin_session');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;


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
    const response = await apiClient.post('/core/admin-api-login/', {
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
    await apiClient.post('/core/admin-logout/');
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    const db = await getAuthDB();
    await db.delete(AUTH_STORE, 'session');
  }
}


// ==================== src/services/storage.js ====================
import { openDB } from 'idb';

const DB_NAME = 'admin_carrier_db';
const DB_VERSION = 2;

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


// ==================== src/services/downloader.js ====================
import { apiClient } from './apiClient';
import { saveContent } from './storage';

export async function downloadContentFromDjango() {
  try {
    const response = await apiClient.get('/api/admin/bulk-download/');
    const data = response.data;

    // Save to IndexedDB
    await saveContent(data);

    return {
      success: true,
      stats: {
        departments: data.departments.length,
        courses: data.courses.length,
        topics: data.topics.length,
        users: data.premium_users.length,
        timestamp: data.sync_timestamp,
      },
    };
  } catch (error) {
    console.error('Download error:', error);
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to download content',
    };
  }
}


// ==================== src/services/uploader.js ====================
import { apiClient } from './apiClient';
import { getPendingUsers, markUsersSynced } from './storage';

export async function uploadPendingUsers() {
  try {
    const pendingUsers = await getPendingUsers();

    if (pendingUsers.length === 0) {
      return {
        success: true,
        message: 'No pending users to upload',
        created: 0,
      };
    }

    // Format users for Django
    const usersData = pendingUsers.map(u => ({
      name: u.name,
      code: u.code,
      department_id: u.department_id || null,
    }));

    const response = await apiClient.post('/api/admin/upload-users/', {
      users: usersData,
    });

    if (response.data.success) {
      // Mark users as synced
      const userIds = pendingUsers.map(u => u.id);
      await markUsersSynced(userIds);

      return {
        success: true,
        created: response.data.created,
        duplicates: response.data.duplicates,
        errors: response.data.errors,
      };
    }

    return {
      success: false,
      error: 'Upload failed',
    };
  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to upload users',
    };
  }
}


// ==================== src/services/localServer.js ====================
import { getAllContent } from './storage';

// Get local IP address (you'll need to manually set this or detect it)
export function getLocalServerURL() {
  // Common hotspot IPs
  const possibleIPs = [
    '192.168.43.1',  // Android hotspot
    '192.168.137.1', // Windows hotspot
    '172.20.10.1',   // iPhone hotspot
  ];
  
  // For now, return the first one (Android hotspot default)
  // In production, you'd detect the actual IP
  return `http://${possibleIPs[0]}:8080`;
}

// Handle API requests from local network
export async function handleLocalAPIRequest(endpoint, method = 'GET', body = null) {
  const content = await getAllContent();

  // Health check endpoint
  if (endpoint === '/api/health') {
    return {
      admin_pwa: true,
      online: true,
      last_sync: content.sync_info?.timestamp || null,
    };
  }

  // Departments
  if (endpoint === '/api/departments/') {
    return content.departments || [];
  }

  // Department courses
  if (endpoint.match(/^\/api\/departments\/(\d+)\/courses\/$/)) {
    const deptId = parseInt(endpoint.match(/\/departments\/(\d+)\//)[1]);
    const courses = (content.courses || []).filter(c => 
      c.departments.includes(deptId)
    );
    return courses;
  }

  // Course topics
  if (endpoint.match(/^\/api\/courses\/(\d+)\/topics\/$/)) {
    const courseId = parseInt(endpoint.match(/\/courses\/(\d+)\//)[1]);
    const topics = (content.topics || []).filter(t => 
      t.course_id === courseId
    );
    
    // Return topic metadata only
    return topics.map(t => ({
      id: t.id,
      title: t.title,
      page_range: t.page_range,
      updated_at: t.updated_at,
      is_refined: !!t.refined_summary,
      is_premium: t.is_premium,
    }));
  }

  // Topic detail
  if (endpoint.match(/^\/api\/topics\/(\d+)\/$/)) {
    const topicId = parseInt(endpoint.match(/\/topics\/(\d+)\//)[1]);
    const topic = (content.topics || []).find(t => t.id === topicId);
    
    if (!topic) {
      throw new Error('Topic not found');
    }

    const course = (content.courses || []).find(c => c.id === topic.course_id);
    const departments = (content.departments || []).filter(d =>
      course?.departments.includes(d.id)
    );

    return {
      id: topic.id,
      title: topic.title,
      page_range: topic.page_range,
      refined_summary: topic.refined_summary,
      raw_text: topic.raw_text,
      course_name: course?.name || 'Unknown',
      course_year: course?.year || '',
      departments: departments.map(d => d.name),
      updated_at: topic.updated_at,
      created_at: topic.created_at,
      is_premium: topic.is_premium,
    };
  }

  throw new Error('Endpoint not found');
}


// ==================== src/styles/app.css ====================
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: #f9fafb;
}

#root {
  min-height: 100vh;
}

/* Utility classes */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}

.card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 1rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #f59e0b;
  color: white;
}

.btn-primary:hover {
  background: #d97706;
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn-secondary:hover {
  background: #4b5563;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.input:focus {
  outline: none;
  border-color: #f59e0b;
}

.alert {
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.alert-error {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.alert-success {
  background: #d1fae5;
  color: #065f46;
  border: 1px solid #a7f3d0;
}

.alert-info {
  background: #dbeafe;
  color: #1e40af;
  border: 1px solid #bfdbfe;
}