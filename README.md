# 🕐 Worktime Manager

A comprehensive restaurant staff scheduling app with shift management, clock in/out tracking, and shift swap requests.

## ✨ Features

### For Employees
- 📅 View assigned shifts with details
- ⏱️ Clock in/out with persistent timer
- 🔄 Request and manage shift swaps
- 👤 Update personal profile
- 📊 View weekly work summary

### For Admins
- 👥 Create, edit, delete shifts
- 📋 Manage all employees' schedules
- 💰 Set hourly rates per employee
- 📊 View company-wide statistics

## 🚀 Quick Start

### Backend
```bash
cd backend
npm install
npm start
# Expected: ✓ Backend running on http://0.0.0.0:8000
```

### Frontend
```bash
npm install
EXPO_PUBLIC_BACKEND_HOST=localhost EXPO_PUBLIC_BACKEND_PORT=8000 npm start
# Then scan QR code or press 'i' for iOS simulator
```

### Test Accounts
- Admin: `admin@worktime.local`
- Employee: `john@worktime.local`, `jane@worktime.local`

## 📚 Documentation

- **[QUICK_START.md](./QUICK_START.md)** - User guide with all features
- **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** - Complete testing procedures
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Setup, known issues, security
- **[SPRINT_SUMMARY.md](./SPRINT_SUMMARY.md)** - What was implemented

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
├── QUICK_START.md        # User guide
├── TESTING_GUIDE.md      # Testing procedures
├── DEPLOYMENT_GUIDE.md   # Known issues, security
└── SPRINT_SUMMARY.md     # Implementation summary
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
| 10. Testing & Docs | ✅ | Comprehensive guides included |

## 🔐 Security Notes

### Current (MVP)
- ✅ Email-only login
- ✅ Infinite session (no expiry)
- ✅ Backend data filtering
- ✅ Swap authorization

### Before Production
- ❌ Password-based auth with JWT
- ❌ Rate limiting
- ❌ Input validation
- ❌ HTTPS/TLS
- ❌ Audit logging

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for full checklist.

## 📞 Support

1. Check **[QUICK_START.md](./QUICK_START.md)** for usage
2. Check **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** for testing
3. Check **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** for troubleshooting

---

**Status**: ✅ Ready for QA Testing  
**Last Updated**: Today  
**Version**: 1.0 MVP
