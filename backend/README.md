# WorkTime Backend (Simple Express + JSON file)


## Wymagania
- Node.js 18+

## Instalacja i uruchomienie
```powershell
cd backend
npm install
npm start
```
Domyślny port: `http://localhost:4000`.

## Endpoints (bez zabezpieczeń)
- `GET /health` → `{ ok: true }`
- `GET /company` → `{ name }` (pojedyncza firma)
- `POST /login` → body: `{ email }` → zwraca/zakłada użytkownika
- `GET /users/:id` → dane użytkownika
- `GET /shifts?from=&to=` → lista zmian (seedowana dynamicznie na 28 dni)
- `POST /shifts` → `{ date, start, end, role?, location?, assignedUserId? }`
- `PATCH /shifts/:id` → częściowa aktualizacja
- `DELETE /shifts/:id` → usuń zmianę
- `POST /shifts/:id/assign` → `{ userId|null }` przypisz/odwiąż pracownika
- `GET /timesheets?userId=&from=&to=` → lista rejestrów wejść/wyjść
- `POST /timesheets/clock-in` → `{ userId, timestamp?, shiftId? }`
- `POST /timesheets/clock-out` → `{ userId, timestamp? }`
- `GET /availabilities?userId=&from=&to=` → dostępności pracowników
- `POST /availabilities` → `{ userId, date, start, end, notes? }`
- `DELETE /availabilities/:id`
- `GET /swaps?userId=` → zgłoszenia zamian zmian
- `POST /swaps` → `{ shiftId, requesterId, targetUserId? }`
- `POST /swaps/:id/accept|reject|cancel` → zmiana statusu (proste)

Dane trzymane w `db/db.json`.