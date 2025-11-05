# 🔧 Debugging Network Connection (Expo Go)

## Problem
```
ERROR  Failed to fetch shifts: [TypeError: Network request failed]
```

## Przyczyny
1. ❌ Backend nie nasłuchuje na wszystkich interfejsach (`0.0.0.0`)
2. ❌ App pobiera adres IP urządzenia, ale komputerowy backend nie słucha na tym adresie
3. ❌ Różne sieci Wi-Fi — urządzenie i komputer w różnych sieciach

## Rozwiązanie (Implementacja)

### Backend: Nasłuchiwanie na 0.0.0.0

W `backend/server.js` linia końcowa:

```javascript
app.listen(PORT, '0.0.0.0', () => {
  ensureSeed();
  console.log(`WorkTime backend listening on http://0.0.0.0:${PORT}`);
});
```

✅ **Już naprawione** — backend teraz nasłuchuje na wszystkich interfejsach.

### Frontend: Automatyczne wykrywanie IP

W `src/utils/api.js`:

```javascript
import * as Network from 'expo-network';

let cachedBaseUrl = null;

async function getBaseUrl() {
  if (cachedBaseUrl) return cachedBaseUrl;

  try {
    if (Platform.OS === 'android' || Platform.OS === 'ios') {
      const ipAddress = await Network.getIpAddressAsync();
      cachedBaseUrl = `http://${ipAddress}:4000`;
      console.log('Device IP:', ipAddress);
      return cachedBaseUrl;
    }
  } catch (error) {
    console.warn('Failed to get network IP:', error);
  }

  cachedBaseUrl = 'http://localhost:4000';
  console.log('Using fallback URL: localhost');
  return cachedBaseUrl;
}

async function http(path, { method = 'GET', body } = {}) {
  const baseUrl = await getBaseUrl();  // ← ważne: await!
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  // ...
}
```

✅ **Już naprawione** — app automatycznie pobiera IP urządzenia.

---

## 🧪 Jak testować

### 1. Upewnij się, że komputer i telefon są w tej samej sieci Wi-Fi

```bash
# Na komputerze (macOS):
ifconfig | grep inet

# Szukaj lini: inet 192.168.x.x (to twój adres)

# Na komputerze (Windows):
ipconfig

# Szukaj "IPv4 Address: 192.168.x.x"
```

### 2. Uruchom backend na 0.0.0.0

```bash
cd backend
node server.js
# Powinno wyświetlić:
# WorkTime backend listening on http://0.0.0.0:4000
```

### 3. Uruchom Expo Go na urządzeniu

```bash
npx expo start --tunnel
# Lub:
npx expo start (i skanuj QR kodem z Expo Go)
```

### 4. Obserwuj logi w Expo Go

Gdy aplikacja się załaduje, powinnaś zobaczyć w logach:
```
Device IP: 192.168.1.X
Pobieranie shifts...
```

Zamiast:
```
Network request failed
```

---

## 🔍 Debugowanie step-by-step

Jeśli wciąż masz błędy:

### Krok 1: Sprawdź, czy backend jest dostępny z urządzenia

```bash
# Na urządzeniu, otwórz przeglądarkę i wpisz:
# http://192.168.1.X:4000/health
# (zamiast 192.168.1.X wpisz swój adres)

# Powinna pokazać:
# {"ok": true}
```

Jeśli nie działa:
- ❌ Adres IP jest zły — sprawdź `ifconfig` ponownie
- ❌ Firewall blokuje port 4000 — dodaj wyjątek dla Node.js
- ❌ Backend nie jest uruchomiony — sprawdź terminal z `node server.js`

### Krok 2: Sprawdź, co zwraca `Network.getIpAddressAsync()`

Dodaj do `api.js`:

```javascript
async function testNetwork() {
  try {
    const ip = await Network.getIpAddressAsync();
    console.log('Network IP:', ip);
    const res = await fetch(`http://${ip}:4000/health`);
    const json = await res.json();
    console.log('Health check:', json);
  } catch (error) {
    console.error('Network test failed:', error);
  }
}

// Wywołaj w testowaniu:
// testNetwork();
```

Otwórz Expo Go, wejdź do konsoli i sprawdź, co się wypisuje.

### Krok 3: Sprawdź logowanie w backendzie

Terminal z backendem powinien wypisać:

```
WorkTime backend listening on http://0.0.0.0:4000
GET /health
GET /users
GET /shifts
```

Jeśli nie vidać żadnych logów — żaden request nie dociera.

---

## ✅ Oczekiwany rezultat

Po naprawach powinnaś zobaczyć:

1. ✅ Backend startuje na `0.0.0.0:4000`
2. ✅ Expo Go ładuje się bez błędów sieciowych
3. ✅ Logi pokazują `Device IP: 192.168.x.x`
4. ✅ Aplikacja pobiera shifts/availabilities/swaps poprawnie

---

## 📝 Szybka lista sprawdzenia

- [ ] Backend nasłuchuje na `0.0.0.0` (sprawdzony — już naprawione)
- [ ] App ma import `import * as Network from 'expo-network'` (sprawdzony — już naprawione)
- [ ] `getBaseUrl()` jest async i zwraca `await baseUrl` w `http()` (sprawdzony — już naprawione)
- [ ] Komputer i telefon są w tej samej Wi-Fi sieci
- [ ] Backend jest uruchomiony (`node server.js`)
- [ ] Brak firewall'a blokującego port 4000
- [ ] Expo Go ma internetu (może obsługiwać http://)

---

Commit tych zmian i spróbuj ponownie! 🚀
