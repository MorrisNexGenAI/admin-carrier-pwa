import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/app.css';

// ----------------------
// PWA Service Worker Registration
// ----------------------
import { registerSW } from 'virtual:pwa-register';

// Register the SW to enable offline caching and install prompt
const updateSW = registerSW({
  onNeedRefresh() {
    console.log('New content available. Refresh the app to update.');
    // Optional: you could show a toast here to let user refresh
  },
  onOfflineReady() {
    console.log('App ready to work offline.');
  },
});

// ----------------------
// Render React App
// ----------------------
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
