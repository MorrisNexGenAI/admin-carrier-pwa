# ==================== .env.example ====================
VITE_DJANGO_URL=https://your-backend.onrender.com


# ==================== .gitignore ====================
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/

# Production
dist/
build/

# Environment
.env
.env.local
.env.production

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# PWA
dev-dist/
sw.js
workbox-*.js


# ==================== README.md ====================
# 📱 Admin Carrier PWA - Study Companion

Offline content distribution hub for Study Companion. This PWA runs on your phone to:
- Download all content from Django when online
- Serve content locally to nearby User PWAs (no internet needed)
- Collect user registrations offline
- Upload collected data to Django when back online

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env and set VITE_DJANGO_URL to your Django backend
```

### 3. Run Development Server
```bash
npm run dev
```

App will run on `http://0.0.0.0:8080`

### 4. Build for Production
```bash
npm run build
npm run preview
```

---

## 🔐 Login

Use your Django admin credentials:
- Same username/password as Django admin panel
- No separate registration needed

---

## 📖 Usage Flow

### **Step 1: Download Content (When Online)**
1. Login to the app
2. Click "Download from Django"
3. Wait for sync to complete
4. Check stats to confirm

### **Step 2: Serve Locally (When Offline)**
1. Enable phone hotspot
2. Students connect to your hotspot
3. They open their User PWA
4. Updates happen automatically

### **Step 3: Upload Data (When Online Again)**
1. Return to town/internet
2. Click "Upload Users to Django"
3. User registrations sync to database

---

## 🌐 Network Setup

### **Default Hotspot IPs:**
- Android: `192.168.43.1:8080`
- Windows: `192.168.137.1:8080`
- iPhone: `172.20.10.1:8080`

User PWAs will automatically detect and connect to these IPs.

### **How to Enable Hotspot:**

**Android:**
1. Settings → Network & Internet → Hotspot
2. Turn on Wi-Fi hotspot
3. Note the network name

**iPhone:**
1. Settings → Personal Hotspot
2. Toggle "Allow Others to Join"
3. Note the password

---

## 📁 Project Structure

```
admin-carrier-pwa/
├── src/
│   ├── services/          # API, Auth, Storage logic
│   │   ├── apiClient.js   # Axios instance
│   │   ├── auth.js        # Django login
│   │   ├── storage.js     # IndexedDB
│   │   ├── downloader.js  # Bulk download
│   │   ├── uploader.js    # Upload users
│   │   └── localServer.js # Local API logic
│   ├── components/        # React components
│   ├── pages/            # App pages
│   └── styles/           # CSS
├── public/               # Static assets
└── vite.config.js        # Vite config
```

---

## 💾 Storage

### **IndexedDB Stores:**
1. **content** - Downloaded departments, courses, topics, users
2. **pending_users** - User registrations waiting to upload
3. **settings** - App preferences
4. **auth** - Login session

### **Data Persistence:**
- Content persists across app restarts
- Clear manually in Settings → Clear All Content

---

## 🔧 Troubleshooting

### **Can't login?**
- Check internet connection
- Verify Django backend URL in `.env`
- Ensure Django admin credentials are correct

### **Download fails?**
- Check internet connection
- Verify backend is running
- Check browser console for errors

### **Students can't connect?**
- Ensure hotspot is enabled
- Check IP address matches expected range
- Students must be connected to YOUR hotspot

### **Upload fails?**
- Check internet connection
- Verify you're logged in
- Check if there are pending users

---

## 🎯 Features

- ✅ Django admin authentication
- ✅ Bulk content download
- ✅ Offline storage (IndexedDB)
- ✅ Local API server simulation
- ✅ User registration collection
- ✅ Batch user upload
- ✅ Sync status tracking
- ✅ Auto-cleanup settings

---

## 🚨 Important Notes

### **PWA Limitations:**
- Cannot auto-create Wi-Fi hotspots (manual setup required)
- Cannot truly open a socket server (uses service worker)
- Background sync has limitations on iOS

### **Battery Usage:**
- Keep phone charged when serving
- Hotspot drains battery faster
- Close other apps to save power

### **Data Costs:**
- Download content on Wi-Fi when possible
- One download serves many students
- Much cheaper than each student downloading individually

---

## 📱 Deployment

This PWA should NOT be deployed to a public URL. It's meant to run locally on your phone only.

### **For Testing:**
1. Build: `npm run build`
2. Serve locally: `npm run preview`
3. Access from other devices on same network

### **For Production Use:**
1. Install as PWA on your phone
2. Use in standalone mode (app-like)
3. No installation needed for students (they use User PWA)

---

## 🤝 Support

For issues or questions, contact the developer or check the main Study Companion documentation.

---

**Built for offline-first education in Liberia 🇱🇷**