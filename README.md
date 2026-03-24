# MMA Manager - Fight Management System

Plnohodnotná webová hra pro správu MMA zápasníků s industriálním dark designem. Hráč si vytvoří vlastního zápasníka, trénuje ho, odemyká dovednosti a bojuje v PvP systému proti ostatním hráčům nebo AI soupeřům. Backend běží na Supabase (PostgreSQL + Auth + Realtime).

> **Stav projektu:** Aktivní vývoj — core funkce jsou plně implementovány a funkční.

---

## Design systém — Forge & Octagon

Projekt používá paletu **"Industrial Luxury"** inspirovanou kovárnou a oktagonem.

| Token | Barva | Použití |
|---|---|---|
| `forge-gold` | `#C9A84C` | Primární akcent, CTA tlačítka, ikony |
| `burnished` | `#A07830` | Hover stavy, sekundární zvýraznění |
| `oxblood` | `#8B2020` | Nebezpečí, ztráta, destruktivní akce |
| `steel` | `#7B8FA5` | Pomocný text, rámečky, ikony |
| `iron` | `#2E3140` | Karty, oddíly |
| `gunmetal` | `#1A1C24` | Pozadí panelů a sidebaru |
| `concrete` | `#09090B` | Hlavní pozadí stránky |
| `ash` | `#4A505E` | Tlumené texty, oddělovače |

Pozadí stránky má jemný **chain-link mesh overlay** pro industriální texturu. Typografie kombinuje **Oswald** (nadpisy), **Montserrat** (akcenty) a **Inter** (tělo textu).

---

## Implementované funkce

### Autentizace a uživatelé
- Registrace a přihlášení přes Supabase Auth (email + heslo)
- Ochrana rout — nepřihlášení uživatelé jsou přesměrováni na `/login`
- Po registraci je vyžadováno vytvoření postavy (`/create-fighter`) — dokud není hotovo, ostatní stránky jsou nedostupné
- Profil se vytváří automaticky PostgreSQL triggerem při registraci

### Tvorba postavy (Visual Builder)
- Vícestupňový průvodce: jméno, přezdívka, výběr země (ISO vlajky)
- Vizuální avatar: 8 archetype těl, tóny pleti, střihy vlasů + barvy, vousy, volně umísťovaná tetování

### Dashboard
- Agregované skill indexy: Striking Index, Grappling Index, BJJ Index, Physical Index
- Animovaný Energy Banner s živým zobrazením energie
- Rychlé shrnutí nejsilnějších atributů zápasníka

### Gym (Trénink)
- 4 tréninkové kategorie × 4 obtížnostní tiery
- Každý trénink spotřebovává energii a aktualizuje statistiky přímo v Supabase
- 15% šance na zisk skill pointu za trénink
- Offline energy recovery — energie se doplňuje i při zavřené aplikaci (přes localStorage timestamp)
- Regen: 10 energie za minutu (interval 6s kdy je aplikace otevřená)

### Arena (PvP systém)
- Matchmaking z reálné databáze (hráči v podobném reputačním rozsahu)
- Výběr soupeře s náhledem statistik a vizuálu
- Spuštění zápasu přes globální Fight Engine

### Fight Engine
- 3 kola × 5 minut real-time combat simulace
- Tři oblasti poškození: hlava / tělo / nohy (každá 100 HP)
- Dvě fáze boje: STANDUP (postoj) a GROUND (zem)
- Skill trigger systém — unlocknuté dovednosti mají šanci na speciální efekty (counter, intercept, slam, leg catch, …)
- Kontextové komentáře generované dle typu akce
- Výsledek zápase se ukládá do `fight_history` + aktualizuje se W/L/D, reputace, XP v profiles
- **CombatWidget** — plovoucí HUD přežívá navigaci, takže zápas lze sledovat z jakékoliv stránky

### Skill Tree (Strom dovedností)
- ~160 skill nodů ve 4 doménách: Striking / Wrestling / BJJ / Defense
- Každá doména má 4 cesty po 10 levelech
- Grafická vizualizace stromové struktury (SVG spojení uzlů)
- Unlock za skill pointy, vyžaduje splnění prerekvizit
- Pasivní bonusy unlocknutých skillů jsou přičítány k base statům při každém výpočtu

### Rankings (Žebříček)
- Žebříček reálných hráčů i AI soupeřů z `leaderboard_fighters`
- Real-time aktualizace přes Supabase Realtime subscription
- Tlačítko Challenge pro přímé vyzvání hráče z žebříčku

### Fighter Profile
- 4 záložky detailních statů: Striking / Wrestling / BJJ / Physical (6–10 atributů každá)
- Záložka Fight History z databáze

### Admin Dashboard (`/admin-login` → `/admin`)
- Přihlášení přes env proměnné (`VITE_ADMIN_USERNAME` / `VITE_ADMIN_PASSWORD`)
- Přehled a editace statů libovolného uživatele
- Doplnění energie, reset kariéry, reset tvorby postavy (`has_character`)

### Internacionalizace a UX
- 3 jazyky: angličtina / čeština / polština (přepínač v UI)
- 9-skladbový music player (shuffle, prev/next/mute, toast s názvem skladby)
- Notifikační systém pro herní události

---

## Tech Stack

| Vrstva | Technologie |
|---|---|
| Frontend | React 18.3.1 + TypeScript |
| Build | Vite 5.4.0 |
| Styling | Tailwind CSS 3.4.1 + custom Forge & Octagon paleta |
| Fonty | Oswald + Montserrat + Inter (Google Fonts) |
| Animace | Framer Motion 11.0.8 |
| Routing | React Router DOM 7.x |
| Backend / DB | Supabase (PostgreSQL + Auth + Realtime) |
| Ikony | Lucide React 0.462.0 |
| i18n | Vlastní překlady (en/cs/pl) |

---

## Databázové schéma (Supabase)

| Tabulka | Obsah |
|---|---|
| `profiles` | 30 MMA atributů, `visual_config` (JSONB), `skill_points`, `unlocked_skills`, `has_character`, `country_code`, W/L/D, reputace, XP |
| `fight_history` | Výsledek, metoda, kola, damage, hits, XP, snapshot statů obou zápasníků |
| `training_sessions` | Exercise ID, kategorie, tier, stat_changes (JSONB), skill_point_awarded |
| `leaderboard_fighters` | AI soupeři v žebříčku (`is_active` flag) |

Triggery a funkce: `admin_reset_character()`, `admin_reset_all_characters()`, automatické vytváření profilu při registraci.

---

## Struktura projektu

```
MMA/
├── src/
│   ├── components/           # Znovupoužitelné UI komponenty
│   │   ├── CombatWidget.tsx  # Plovoucí fight HUD (živý přes všechny routy)
│   │   ├── FighterInitialization.tsx  # Wizard tvorby postavy
│   │   ├── FighterVisual.tsx # Vizuální avatar renderer
│   │   ├── Layout.tsx        # Sidebar + hlavní obsah
│   │   ├── Sidebar.tsx       # Navigace
│   │   └── ...
│   ├── context/              # React Contexty (globální stav)
│   │   ├── AuthContext.tsx   # Supabase Auth + admin login
│   │   ├── FighterContext.tsx # Profil zápasníka, energy regen, skill bonusy
│   │   ├── FightContext.tsx  # Fight engine (globální, přežívá navigaci)
│   │   ├── LanguageContext.tsx
│   │   ├── MusicContext.tsx
│   │   └── NotificationContext.tsx
│   ├── pages/                # Stránky aplikace
│   │   ├── Dashboard.tsx
│   │   ├── Gym.tsx
│   │   ├── Arena.tsx
│   │   ├── Rankings.tsx
│   │   ├── FighterProfile.tsx
│   │   ├── SkillTree.tsx
│   │   ├── CreateFighter.tsx
│   │   ├── Login.tsx
│   │   ├── Registration.tsx
│   │   ├── AdminDashboard.tsx
│   │   └── AdminLogin.tsx
│   ├── constants/
│   │   ├── battlePhrases.ts  # Generátor kontextuálních komentářů k boji
│   │   ├── skillTree.ts      # ~160 skill nodů (definice, prerekvizity, efekty)
│   │   └── translations.ts   # Překlady en/cs/pl
│   ├── utils/
│   │   ├── training.ts       # performTraining() — logika tréninku
│   │   ├── stats.ts          # calculateEnhancedStats() — base stats + skill bonusy
│   │   └── opponents.ts      # Fallback AI soupeři
│   ├── lib/
│   │   └── supabase.ts       # Supabase klient
│   ├── App.tsx               # Routing, provider stack, CharacterGate
│   └── types.ts              # Sdílené TypeScript typy
├── supabase/
│   └── migrations/           # SQL migrace (002–006 + skill_tree_columns)
├── public/
│   ├── images/               # Vizuální assety zápasníků
│   └── music/                # 9 MP3 skladeb
├── index.html
├── package.json
├── tailwind.config.js
├── vite.config.ts
├── start_project.bat         # Rychlý start pro Windows
├── start_project.sh          # Rychlý start pro macOS/Linux
└── README.md
```

---

## Spuštění projektu

### Požadavky
- Node.js 18+
- Supabase projekt s konfigurovanými env proměnnými

### Env proměnné (`.env`)
```env
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
VITE_ADMIN_USERNAME=admin
VITE_ADMIN_PASSWORD=<your-admin-password>
```

### Windows
Dvojklik na `start_project.bat` — automaticky nainstaluje závislosti a spustí dev server.

### macOS / Linux
```bash
chmod +x start_project.sh
./start_project.sh
```

### Manuálně
```bash
npm install
npm run dev
```

Aplikace běží na http://localhost:5173

---

## Dostupné skripty

| Příkaz | Popis |
|---|---|
| `npm run dev` | Spustí dev server (Vite HMR) |
| `npm run build` | Sestaví produkční build (TypeScript + Vite) |
| `npm run preview` | Náhled produkčního buildu |
| `npm run lint` | ESLint kontrola |

---

## Barevná paleta

| Role | Hodnota |
|---|---|
| Pozadí | `#0a0a0a`, `#1a1a1a`, `#2a2a2a` |
| Primární akcent | Neon zelená `#00ff41` |
| Sekundární akcent | Alert červená `#ff3333` |
| Text | Bílá a odstíny šedé |

---

## Známé problémy / TODO

- `src/pages/Arena_OLD_BACKUP.tsx` — stará záloha arény, nebyla odstraněna
- Admin autentizace je jednoduchá (env proměnné + localStorage flag) — nevhodné pro produkci
- V kódu se vyskytují `console.log` ladící výpisy (AuthContext, FighterContext, Arena)
- Horní limit statů v `utils/training.ts` je místy `250` místo konzistentního `100`
- Smooth animations and transitions

## Next Steps

The Fighter Logic module will be added next to handle:
- Fighter creation and management
- Fighter stats and attributes
- Training program management
- Fight scheduling and results

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Development

1. Make sure Node.js 16+ is installed
2. Run `npm install` to install dependencies
3. Run `npm run dev` to start the development server
4. Open http://localhost:5173 in your browser

## License

MIT

<img width="1468" height="798" alt="image" src="https://github.com/user-attachments/assets/0421f594-7cf8-4b6d-880b-a638629f20da" />

