# Dashboard Systemu i Walut

## 📋 Opis Projektu

Nowoczesny dashboard typu "single page" wyświetlający informacje systemowe oraz kursy walut w czasie rzeczywistym. Zaprojektowany w stylu ciemnym (dark mode) z dbałością o estetykę i użyteczność.

## ✨ Funkcjonalności

### 🖥️ Panele Systemowe (Symulacja)
- **System Status**: Wyświetla informacje o systemie w stylu `neofetch` (OS, Kernel, Uptime, CPU, RAM, Disk).
- **Code Editor**: Podgląd edytora kodu z kolorowaniem składni dla Pythona.
- **File Explorer**: Drzewo plików projektu.
- **Docker Containers**: Lista kontenerów Docker w stylu terminala.
- **Output / Terminal**: Dodatkowy panel wyjściowy (np. logi lub podgląd kamery).

### 💰 Monitor Walut (Real-time)
- **Dane na żywo**: Pobieranie kursów walut (NBP), kryptowalut (CoinGecko) i surowców (Metals.live).
- **Wsparcie dla wielu aktywów**:
  - Waluty fiat (EUR, USD, GBP, CHF, etc.)
  - Kryptowaluty (BTC, ETH)
  - Metale szlachetne (Złoto, Srebro)
  - Akcje (NVDA)
- **Interaktywne Wykresy**: Wyświetlanie historii kursów dla wybranych aktywów (7, 14, 30 dni).
- **Automatyczne Odświeżanie**: Dane są aktualizowane co 5 minut.
- **Wskaźniki Zmian**: Wizualna informacja o wzroście/spadku kursu względem poprzedniego odczytu.

### 📷 Podgląd Kamer
- Integracja ze strumieniami wideo z kamer przemysłowych lub internetowych.

## 🛠️ Technologie

- **HTML5 & CSS3**: Flexbox, Grid Layout, Zmienne CSS.
- **JavaScript (Vanilla)**: Brak ciężkich frameworków.
- **Chart.js**: Renderowanie wykresów walut.
- **Font Awesome**: Ikony.
- **API Zewnętrzne**:
  - NBP API (Waluty i Złoto)
  - CoinGecko API (Kryptowaluty)
  - Metals.live API (Srebro)

## 📁 Struktura Projektu

```
/
├── index.html            # Główny plik aplikacji
├── css/
│   ├── style.css         # Style ogólne i układ dashboardu
│   └── waluty.css        # Style specyficzne dla modułu walut
├── js/
│   ├── script.js         # Logika ogólna (fullscreen)
│   ├── currency-service.js # Logika pobierania danych (API)
│   └── waluty.js         # Logika UI modułu walut
└── README.md             # Dokumentacja
```

## 🚀 Uruchomienie

1. Sklonuj repozytorium lub pobierz pliki.
2. Otwórz `index.html` w dowolnej nowoczesnej przeglądarce.
   - **Uwaga**: Ze względu na politykę CORS niektórych API, zaleca się uruchomienie projektu na lokalnym serwerze (np. Live Server w VS Code, `python -m http.server`, `php -S localhost:8000`).

## 🎨 Dostosowanie

### Zmiana URL Kamer:
W pliku `index.html` znajdź tagi `img` w sekcjach `Camera Feed` i podmień atrybut `src` na własny strumień MJPEG lub obraz statyczny.

### Dodawanie Walut:
W pliku `js/currency-service.js` (lub `waluty.js` przed refaktoryzacją) znajduje się tablica `currencies`, którą można edytować.

## 📝 Licencja

Projekt dostępny na licencji MIT.
