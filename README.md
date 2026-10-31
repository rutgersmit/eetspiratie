# Eetspiratie - Recepten App

Een Progressive Web App (PWA) voor het opslaan en beheren van recepten. Gebouwd met Next.js, TypeScript en Tailwind CSS. Alles draait in één container: de recepten staan in een SQLite-database en de foto's op schijf. Er zijn geen externe diensten nodig.

## Features

- Recepten toevoegen, bewerken en verwijderen
- Afbeeldingen uploaden per recept
- Zoeken op titel, ingrediënten en omschrijving (hoofdletter- en accentongevoelig)
- Sorteren op datum (nieuwste/oudste) en titel (A-Z/Z-A)
- Recepten publiek delen via een link (`/r/<slug>`)
- Kookmodus: houdt het scherm aan
- PWA: installeerbaar op desktop en mobiel
- Eén login, ingesteld via environment variables

## Tech Stack

- **Frontend/backend**: Next.js 16 (App Router, server actions) + TypeScript
- **Styling**: Tailwind CSS
- **Database**: SQLite via de ingebouwde `node:sqlite` module (Node 22.13+), geen extra dependencies
- **Afbeeldingen**: bestanden in de data-map
- **PWA**: Custom Service Worker

---

## Configuratie

Alle instellingen gaan via environment variables. Kopieer `.env.example` naar `.env` (Docker) of `.env.local` (lokaal ontwikkelen) en vul in:

| Variabele | Verplicht | Omschrijving |
|-----------|-----------|--------------|
| `AUTH_USERNAME` | ja | Gebruikersnaam voor de login |
| `AUTH_PASSWORD` | ja | Wachtwoord. Kies een lang, uniek wachtwoord |
| `AUTH_SECRET` | ja | Willekeurige geheime sleutel (min. 32 tekens) waarmee de sessiecookie ondertekend wordt |
| `COOKIE_SECURE` | nee | `true`/`false`. Standaard is de cookie `Secure` als het verzoek via HTTPS binnenkomt (`X-Forwarded-Proto: https`) |
| `DATA_DIR` | nee | Map voor database en afbeeldingen. Standaard `./data`, in Docker `/app/data` |

Een secret genereren:

```bash
openssl rand -base64 32
```

> **Let op:** deze repository is openbaar. Zet nooit echte waarden in `.env.example`, `docker-compose.yml` of een ander bestand dat gecommit wordt. `.env`, `.env.local` en `data/` staan in `.gitignore`.

Ontbreekt een van de verplichte variabelen, of is `AUTH_SECRET` korter dan 32 tekens, dan kan niemand inloggen. De loginpagina meldt dat dan.

### Wachtwoord vergeten / wijzigen

Er is geen resetfunctie. Pas `AUTH_PASSWORD` aan in de `.env` op de server en herstart de container:

```bash
docker compose up -d
```

Een nieuw wachtwoord, een nieuwe gebruikersnaam of een nieuw `AUTH_SECRET` logt meteen alle apparaten uit.

---

## Draaien met Docker

```bash
cp .env.example .env   # en vul de waarden in
docker compose up -d --build
```

De app draait dan op [http://localhost:3000](http://localhost:3000). De database en foto's staan in `./data` op de host. Bij het starten zet de container de eigenaar van die map op het interne app-account (uid 1001) en draait daarna niet meer als root.

### Deploy naar de server

`deploy.sh` kopieert de code met rsync naar de server en bouwt daar de container opnieuw. De map `data/` en `.env` op de server worden nooit overschreven of verwijderd.

```bash
./deploy.sh
```

Zet de `.env` eenmalig zelf op de server in `/data/docker/eetspiratie/.env`.

### Achter een reverse proxy (HTTPS)

Draait de app achter bijvoorbeeld Nginx Proxy Manager, Caddy of Traefik met HTTPS, laat de proxy dan `X-Forwarded-Proto` meesturen (doen ze standaard). De sessiecookie wordt dan automatisch `Secure`.

---

## Lokaal ontwikkelen

Vereist Node.js 22.13 of nieuwer.

```bash
npm install
cp .env.example .env.local   # en vul de waarden in
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Data komt in `./data`.

---

## Backup

Alles staat in de data-map:

```
data/
├── eetspiratie.db        # SQLite database (+ -wal / -shm bestanden)
└── images/               # geüploade foto's
```

De simpelste backup: stop de container even en kopieer de hele map.

```bash
docker compose stop && tar czf eetspiratie-backup.tgz data && docker compose start
```

---

## Migratie vanuit Supabase

Eerdere versies gebruikten Supabase. Met `scripts/import-supabase.mjs` haal je alle recepten en foto's daaruit op en zet je ze in de lokale database. Het script gebruikt alleen `fetch`, er is geen Supabase-library nodig. Recepten die al geïmporteerd zijn (zelfde id) worden overgeslagen, dus je kunt het veilig opnieuw draaien.

Zorg dat het Supabase-project actief is (op de gratis tier eventueel eerst "Restore project" in het dashboard). Draai daarna, met de container aan:

```bash
docker compose exec -u nextjs \
  -e SUPABASE_URL=https://xxxxx.supabase.co \
  -e SUPABASE_ANON_KEY=eyJ... \
  -e SUPABASE_EMAIL=jouw@email.nl \
  -e SUPABASE_PASSWORD='je-supabase-wachtwoord' \
  eetspiratie node scripts/import-supabase.mjs
```

De URL en anon key vind je in het Supabase dashboard onder **Project Settings → API**. Het e-mailadres en wachtwoord zijn die van je oude Eetspiratie-login. Gebruik `-u nextjs`, zodat de nieuwe bestanden van het app-account zijn.

Publieke deellinks (`/r/<slug>`) blijven werken, want de slugs worden overgenomen.

---

## Beveiliging

- **Login**: gebruikersnaam en wachtwoord worden in constante tijd vergeleken. Na 5 mislukte pogingen per client (en 30 in totaal) binnen 15 minuten wordt inloggen tijdelijk geblokkeerd.
- **Sessie**: een `HttpOnly`, `SameSite=Lax` cookie, 30 dagen geldig, ondertekend met HMAC-SHA256 (`AUTH_SECRET`). Elke pagina en server action controleert de sessie.
- **Uploads**: het bestandstype wordt bepaald aan de hand van de inhoud (magic bytes), niet aan de hand van de bestandsnaam. Alleen JPG, PNG, GIF en WebP tot 10MB. Bestanden krijgen een willekeurige UUID als naam.
- **Afbeeldingen** worden geserveerd via `/api/images/<uuid>.<ext>` zonder sessiecontrole, omdat de Next.js image-optimizer geen cookies meestuurt. De namen zijn willekeurige UUID's, dus wie de link niet heeft kent de URL niet. Dat is vergelijkbaar met de signed URLs die Supabase gebruikte, behalve dat de link niet verloopt.
- **Bron-links** moeten met `http://` of `https://` beginnen.

---

## Project Structuur

```
eetspiratie/
├── public/                 # PWA iconen, manifest, service worker
├── scripts/
│   ├── import-supabase.mjs # Eenmalige migratie vanuit Supabase
│   └── start.cjs           # Container-startscript (rechten data-map)
├── src/
│   ├── app/
│   │   ├── api/images/     # Afbeeldingen serveren
│   │   ├── login/          # Login pagina
│   │   ├── r/[slug]/       # Publieke receptpagina
│   │   ├── recipes/        # Overzicht, detail, nieuw, bewerken
│   │   ├── layout.tsx
│   │   └── page.tsx        # Redirect
│   ├── components/         # UI componenten
│   ├── lib/
│   │   ├── actions.ts      # Server actions (login, opslaan, verwijderen, delen)
│   │   ├── auth.ts         # Sessiecontrole voor pagina's
│   │   ├── db.ts           # SQLite verbinding + schema
│   │   ├── images.ts       # Afbeeldingen opslaan/lezen
│   │   ├── rate-limit.ts   # Limiet op mislukte logins
│   │   ├── recipes.ts      # Database queries
│   │   └── session.ts      # Ondertekende sessietokens
│   ├── types/
│   └── proxy.ts            # Auth-check op elke request
├── Dockerfile
├── docker-compose.yml
└── deploy.sh
```

---

## Scripts

| Command | Omschrijving |
|---------|--------------|
| `npm run dev` | Development server starten |
| `npm run build` | Productie build maken |
| `npm start` | Productie server starten |
| `npm run lint` | ESLint draaien |

---

## Licentie

MIT
