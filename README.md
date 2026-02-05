# Eetspiratie - Recepten App

Een moderne Progressive Web App (PWA) voor het opslaan en beheren van recepten. Gebouwd met Next.js, TypeScript, Tailwind CSS en Supabase.

## Features

- Recepten toevoegen, bewerken en verwijderen
- Afbeeldingen uploaden per recept
- Zoeken op titel, ingrediënten en omschrijving
- Sorteren op datum (nieuwste/oudste) en titel (A-Z/Z-A)
- Responsive design: desktop-first formulieren, mobiel-vriendelijke weergave
- PWA: installeerbaar op desktop en mobiel
- Veilige authenticatie met email/wachtwoord
- Wachtwoord reset via email

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Supabase (Postgres + Auth + Storage)
- **PWA**: Custom Service Worker

---

## Setup Instructies

### 1. Supabase Project Aanmaken

1. Ga naar [supabase.com](https://supabase.com) en maak een account aan
2. Klik op "New Project"
3. Vul in:
   - **Organization**: Kies of maak een organisatie
   - **Project name**: `eetspiratie` (of keuze)
   - **Database password**: Kies een sterk wachtwoord (bewaar dit!)
   - **Region**: Kies de dichtstbijzijnde regio (bijv. Frankfurt)
4. Klik op "Create new project" en wacht tot het project klaar is

### 2. Database Schema Uitvoeren

1. In je Supabase dashboard, ga naar **SQL Editor** (linker menu)
2. Klik op "New query"
3. Kopieer de inhoud van `supabase/schema.sql` en plak deze in de editor
4. Klik op "Run" (of Ctrl/Cmd + Enter)
5. Controleer of er geen errors zijn

### 3. Storage Bucket Aanmaken

1. Ga naar **Storage** in het linker menu
2. Klik op "New bucket"
3. Vul in:
   - **Name**: `recipe-images`
   - **Public bucket**: **UIT** (bucket moet privé zijn)
   - **Allowed MIME types**: `image/jpeg, image/png, image/gif, image/webp`
   - **File size limit**: `10MB` (of naar keuze)
4. Klik op "Create bucket"

De storage policies zijn al aangemaakt via het SQL script.

### 4. Gmail SMTP Configureren voor Supabase Auth

Supabase gebruikt SMTP voor het versturen van authenticatie emails (wachtwoord reset, email verificatie). Volg deze stappen om Gmail te gebruiken:

#### 4.1 Gmail App Password Aanmaken

1. Ga naar je Google Account: [myaccount.google.com](https://myaccount.google.com)
2. Ga naar **Beveiliging** (Security)
3. Zorg dat **2-stapsverificatie** (2-Step Verification) aan staat
4. Ga naar **App-wachtwoorden** (App passwords):
   - Zoek "App passwords" of ga naar: [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
5. Selecteer **App**: "Mail" of "Other (Custom name)" → typ "Supabase"
6. Selecteer **Device**: "Other (Custom name)" → typ "Eetspiratie"
7. Klik op **Genereren**
8. **Kopieer het 16-teken wachtwoord** (bijv. `abcd efgh ijkl mnop`)
   - Dit is je App Password, bewaar het veilig!

#### 4.2 Supabase SMTP Instellingen

1. In Supabase dashboard, ga naar **Project Settings** (tandwiel icoon)
2. Klik op **Auth** in het linker submenu
3. Scroll naar **SMTP Settings**
4. Zet **Enable Custom SMTP** aan
5. Vul de volgende gegevens in:

| Veld | Waarde |
|------|--------|
| **Sender email** | `jouw-email@gmail.com` |
| **Sender name** | `Eetspiratie` |
| **Host** | `smtp.gmail.com` |
| **Port number** | `587` |
| **Minimum interval** | `60` (of lager naar wens) |
| **Username** | `jouw-email@gmail.com` |
| **Password** | Je 16-teken App Password (zonder spaties) |

6. Klik op **Save**

#### 4.3 Email Templates Aanpassen (Optioneel)

1. Ga naar **Auth** → **Email Templates**
2. Je kunt de volgende templates aanpassen:
   - **Confirm signup**: Email bij registratie
   - **Reset password**: Email voor wachtwoord reset
   - **Magic Link**: Email voor passwordless login (indien gebruikt)

### 5. Environment Variables

1. Kopieer `.env.example` naar `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. In je Supabase dashboard, ga naar **Project Settings** → **API**

3. Kopieer de volgende waarden naar `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### 6. Lokaal Draaien

```bash
# Dependencies installeren
npm install

# Development server starten
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in je browser.

### 7. Productie Build

```bash
# Build maken
npm run build

# Productie server starten
npm start
```

---

## PWA Installatie

### Desktop (Chrome/Edge)
1. Open de app in je browser
2. Klik op het installatie icoon in de adresbalk (of menu → "Installeer Eetspiratie")
3. Klik op "Installeren"

### iOS (Safari)
1. Open de app in Safari
2. Tik op het deel-icoon (vierkant met pijl omhoog)
3. Scroll en tik op "Zet op beginscherm"
4. Geef een naam en tik op "Voeg toe"

### Android (Chrome)
1. Open de app in Chrome
2. Tik op de drie puntjes (menu)
3. Tik op "Toevoegen aan startscherm"
4. Bevestig

---

## Testen

### Checklist voor testen:

#### Authenticatie
- [ ] Registreren met email/wachtwoord
- [ ] Verificatie email ontvangen (indien ingesteld)
- [ ] Inloggen met email/wachtwoord
- [ ] Wachtwoord vergeten → reset email ontvangen
- [ ] Nieuw wachtwoord instellen via reset link
- [ ] Uitloggen

#### Recepten
- [ ] Nieuw recept toevoegen (alleen titel + ingrediënten)
- [ ] Recept toevoegen met afbeelding (drag & drop)
- [ ] Recept toevoegen met omschrijving
- [ ] Recept bekijken in detail
- [ ] Recept bewerken
- [ ] Afbeelding vervangen
- [ ] Afbeelding verwijderen
- [ ] Recept verwijderen (met bevestiging)

#### Zoeken & Sorteren
- [ ] Zoeken op titel
- [ ] Zoeken op ingrediënt
- [ ] Zoeken op omschrijving
- [ ] "Geen resultaten" state zichtbaar
- [ ] Sorteren: Nieuwste eerst
- [ ] Sorteren: Oudste eerst
- [ ] Sorteren: Titel A-Z
- [ ] Sorteren: Titel Z-A

#### PWA
- [ ] App installeren op desktop
- [ ] App installeren op mobiel
- [ ] App opent in standalone modus

---

## Troubleshooting

### Gmail SMTP Werkt Niet

1. **"Username and Password not accepted"**
   - Controleer of je het App Password gebruikt, NIET je normale Gmail wachtwoord
   - Zorg dat het App Password zonder spaties is ingevoerd
   - Controleer of 2FA aan staat op je Google account

2. **Emails komen niet aan**
   - Check je spam folder
   - Controleer of het sender email adres correct is
   - Wacht enkele minuten, er kan vertraging zijn

3. **"Less secure app access" fout**
   - Deze optie bestaat niet meer bij Google
   - Gebruik altijd een App Password met 2FA

### Database Errors

1. **"relation does not exist"**
   - Voer het SQL schema opnieuw uit
   - Controleer of je in de juiste database bent

2. **"permission denied"**
   - Controleer de RLS policies
   - Zorg dat je ingelogd bent

### Storage Errors

1. **"Bucket not found"**
   - Maak de bucket `recipe-images` aan via de dashboard
   - De naam moet exact overeenkomen

2. **"Permission denied" bij upload**
   - Controleer de storage policies
   - Het bestandspad moet beginnen met je user_id

---

## Project Structuur

```
eetspiratie-app/
├── public/
│   ├── icons/              # PWA iconen
│   ├── manifest.json       # PWA manifest
│   └── sw.js              # Service Worker
├── src/
│   ├── app/
│   │   ├── auth/callback/  # Auth callback route
│   │   ├── login/          # Login pagina
│   │   ├── recipes/        # Recepten pagina's
│   │   │   ├── [id]/       # Detail & edit
│   │   │   └── new/        # Nieuw recept
│   │   ├── reset-password/ # Wachtwoord reset
│   │   ├── globals.css     # Globale styles
│   │   ├── layout.tsx      # Root layout
│   │   └── page.tsx        # Homepage (redirect)
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── ImageUploader.tsx
│   │   ├── RecipeCard.tsx
│   │   ├── RecipeDetail.tsx
│   │   ├── RecipeForm.tsx
│   │   ├── RecipeList.tsx
│   │   ├── SearchBar.tsx
│   │   └── SortMenu.tsx
│   ├── lib/
│   │   └── supabase/
│   │       ├── client.ts   # Browser client
│   │       └── server.ts   # Server client
│   ├── types/
│   │   └── database.ts     # TypeScript types
│   └── middleware.ts       # Auth middleware
├── supabase/
│   └── schema.sql          # Database schema
├── .env.example
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Create production build |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |

---

## Licentie

MIT
