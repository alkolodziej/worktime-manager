# Dokumentacja: Dummy Data i GET /users Endpoint

## 📊 Co zostało zrobione

### Backend (`backend/`)

#### 1. **Zaktualizowano `db/db.json`** — Dodano dummy data

```json
{
  "availabilities": [
    {
      "id": "av1",
      "userId": "1",
      "date": "2025-11-08",
      "start": "09:00",
      "end": "17:00",
      "notes": "Dostępny cały dzień"
    },
    // ... więcej rekordów
  ],
  "swaps": [
    {
      "id": "swap1",
      "shiftId": "3",
      "requesterId": "1",
      "targetUserId": "2",
      "status": "pending",
      "createdAt": "2025-11-05T10:00:00.000Z",
      "updatedAt": "2025-11-05T10:00:00.000Z"
    },
    // ... więcej rekordów
  ],
  "timesheets": [
    {
      "id": "ts1",
      "userId": "1",
      "shiftId": "1",
      "clockInTime": "2025-11-03T12:05:00.000Z",
      "clockOutTime": "2025-11-03T20:15:00.000Z"
    },
    // ... więcej rekordów
  ]
}
```

**Zawartość:**
- 3 sample dostępności (userId: 1, 2)
- 3 sample swaps (mix statusów: pending, accepted, rejected)
- 3 sample timesheets (różne użytkowniki i shifty)

#### 2. **Nowy endpoint: `GET /users`** w `server.js` (linia ~98)

```javascript
app.get('/users', (req, res) => {
  const db = readDb();
  res.json(db.users || []);
});
```

**Przeznaczenie:** Pobieranie listy wszystkich użytkowników dla pickerów (np. w AdminShiftsScreen przy przypisywaniu pracownika do zmiany).

---

### Frontend (`src/`)

#### 1. **Nowa funkcja API** w `utils/api.js` — `apiGetUsers()`

```javascript
export async function apiGetUsers() {
  return http('/users');
}
```

Pobiera listę użytkowników z backendowego `GET /users`.

#### 2. **Zaktualizowana AdminShiftsScreen** (`screens/AdminShiftsScreen.js`)

- Import: `apiGetUsers` dodany do listy importów
- State: dodany `const [users, setUsers] = React.useState([])`
- Load function: pobranie użytkowników w `load()` callback (razem z pobieraniem zmian)

```javascript
const load = React.useCallback(async () => {
  setLoading(true);
  try {
    const shifts = await apiGetShifts({});
    setList(shifts.map(shift => ({ ...shift, date: new Date(shift.date) })));
  } catch (error) { /* ... */ }
  try {
    const userList = await apiGetUsers();
    setUsers(userList);
  } catch (error) { /* ... */ }
  setLoading(false);
}, []);
```

**Bonus:** Użytkownicy są teraz dostępni w state, gotowi na integrację z Pickerem.

---

## 🧪 Jak testować

### Test backendu (jeśli backend jest uruchomiony)

```bash
# Pobierz użytkowników
curl http://192.168.0.54:4000/users

# Powinno zwrócić:
# [
#   { "id": "1", "email": "aaa", "name": "aaa", "role": "Kelner" },
#   { "id": "2", "email": "aaa7", "name": "aaa7", "role": "Kelner" }
# ]

# Pobierz dostępności
curl http://192.168.0.54:4000/availabilities

# Pobierz swaps
curl http://192.168.0.54:4000/swaps

# Pobierz timesheets
curl http://192.168.0.54:4000/timesheets
```

### Test frontendu

1. Uruchom aplikację: `npx expo start --tunnel`
2. Otwórz ekran **AdminShiftsScreen** — powinna pobrać listę użytkowników
3. Otwórz ekran **AdminRequestsScreen** — powinna wyświetlić dummy swaps i dostępności
4. Otwórz ekran **SwapsScreen** — powinna wyświetlić dummy swaps
5. Otwórz ekran **HomeScreen** — powinna pobierać timesheets dla zalogowanego użytkownika
6. Otwórz ekran **EarningsCalculatorScreen** — powinna pokazywać dane z timesheetów

---

## 📋 Status integralności

| Ekran | Pobiera dummy data | Status |
|-------|-------------------|--------|
| HomeScreen | ✅ timesheets | Działa |
| ScheduleScreen | ✅ shifts | Działa |
| AvailabilityScreen | ✅ availabilities | Działa |
| SwapsScreen | ✅ swaps + shifts | Działa |
| AdminShiftsScreen | ✅ shifts + **users** | ✅ Nowe |
| AdminRequestsScreen | ✅ swaps + availabilities | Działa |
| EarningsCalculatorScreen | ✅ timesheets | Działa |
| ProfileScreen | ✅ company info | Działa |

---

## 🎯 Następne kroki

1. **Integracja Pickera użytkownika** w AdminShiftsScreen — użyj stanu `users` do wyświetlenia listy przy tworzeniu zmiany
2. **Rozszerz dummy data** — dodaj więcej użytkowników, zmian, dostępności (aby aplikacja wyglądała bardziej realnie)
3. **Filtrowanie swapów** — pokażmy tylko swaps, które są dla zalogowanego użytkownika na AdminRequestsScreen
4. **Toast notifications** — potwierdź sukces/błąd przy operacjach API (jest już komponent, trzeba go połączyć)

---

Commit: `d43190b` — "feat: add dummy data and GET /users endpoint"
