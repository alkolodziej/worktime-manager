# 🕐 Worktime Manager

A comprehensive restaurant staff scheduling app with shift management, clock in/out tracking, and shift swap requests.

## ✨ Features

### For Employees
- 📅 View assigned shifts with details
- ⏱️ Clock in/out with persistent timer
- � Location validation (GPS) for clock actions
- �🔄 Request and manage shift swaps
- 👤 Update personal profile
- 📊 View weekly work summary

### For Admins
- 👥 Create, edit, delete shifts
- 📋 Manage all employees' schedules
- 💰 Set hourly rates per employee
- 📊 View company-wide statistics

## 🚀 Quick Start

### Opcja deweloperska (wszystko w jednym)
```bash
npm install && cd backend && npm install && cd ..
npm run dev
```

### Backend (manualnie)
```bash
cd backend
npm install
npm start
# Expected: ✓ Backend running on http://0.0.0.0:8000
```

### Frontend (manualnie)
```bash
npm install
EXPO_PUBLIC_BACKEND_HOST=localhost EXPO_PUBLIC_BACKEND_PORT=8000 npm start
# Then scan QR code or press 'i' for iOS simulator
```

### Test Accounts
- Pracodawca (Admin): `pracodawca` (hasło nie jest wymagane)
- Pracownik: `pracownik` (hasło nie jest wymagane)

## 🛠️ Tech Stack

| Component | Technology |
|-----------|-----------|
| Frontend | React Native 0.81 + Expo 54 |
| Backend | Node.js + Express.js |
| Database | JSON file (`backend/db/db.json`) |
| State Management | React Hooks + Context API |
| Storage | AsyncStorage (session), JSON file (database) |

## 📁 Project Structure

```
.
├── src/
│   ├── screens/          # UI screens
│   ├── components/       # Reusable components
│   ├── context/          # AuthContext
│   ├── navigation/       # Navigation setup
│   ├── utils/            # API calls, formatting, themes
│   └── assets/           # Images, fonts
├── backend/
│   ├── server.js         # Express backend
│   ├── db/
│   │   └── db.json       # Database
│   ├── .env              # Backend config
│   └── package.json
├── .env                  # Frontend config
```

## 🎯 Implementation Status

**Overall: 90% Complete (9/10 phases)**

| Phase | Status | Details |
|-------|--------|---------|
| 1. Env Setup | ✅ | Ports aligned (8000), dotenv |
| 2. Seeding | ✅ | One-time seed (preserves data) |
| 3. Schema | ✅ | Unified `clockIn/clockOut` |
| 4. Backend Filtering | ✅ | Shifts filtered by `?assignedUserId` |
| 5. Auth Middleware | ✅ | Placeholder ready for JWT |
| 6. Session Persistence | ✅ | Infinite AsyncStorage session |
| 7. Shift CRUD | ✅ | Full create/read/update/delete |
| 8. Swap Features | ✅ | Request, prevent duplicates, cancel |
| 9. Shift Details | ✅ | Modal on HomeScreen |
| 10. Testing & Docs | ⚠️ | README zaktualizowane, brak dodatkowych dokumentów |

## 🔐 Security Notes

### Current (MVP)
- ✅ Username-only login
- ✅ Infinite session (no expiry)
- ✅ Backend data filtering
- ✅ Swap authorization

### Before Production
- ❌ Password-based auth with JWT
- ❌ Rate limiting
- ❌ Input validation
- ❌ HTTPS/TLS
- ❌ Audit logging

## 📞 Support

Contact the development team for any issues.

---

**Status**: ✅ Ready for QA Testing  
**Last Updated**: Today  
**Version**: 1.0 MVP
