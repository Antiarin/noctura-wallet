# Noctura Wallet

A Next.js 16 demo app that generates Apple Wallet and Google Wallet passes for a fictional concert ticket. Built to pitch wallet integration capabilities to a client.

**Live demo flow:** type your name → add to Apple Wallet or Google Wallet → open `/?admin=1` → push a status update → watch the pass change on the lockscreen.

## Stack

- Next.js 16 (App Router, Turbopack, React 19.2)
- TypeScript strict
- Tailwind CSS v4 (CSS-first via `@theme`)
- PassKit.com for Apple Wallet (no Apple Developer cert required — PassKit signs for you)
- Google Wallet REST API + JWT save links
- Node 20.9+, yarn

## Setup

### 1. Install

```bash
yarn install
```

### 2. Configure env

Copy the template:

```bash
cp .env.example .env.local
```

Fill in each value as you complete the provider setup below.

### 3. Set up PassKit.com (Apple Wallet)

1. Sign in at [passkit.com](https://passkit.com) (45-day trial is fine).
2. **Developer Tools → Certificates** → generate a new certificate. Download the `.pem` file.
   - The "key name" / ID goes in `PASSKIT_API_KEY`.
   - The full PEM file contents (including `-----BEGIN PRIVATE KEY-----` headers) go in `PASSKIT_API_SECRET`.
3. **Templates → New Event Ticket** → create a template:
   - Header: "NOCTURA PRESENTS"
   - Primary: Attendee name (data field)
   - Secondary: Date, venue
   - Auxiliary: Tier, ticket number
   - Barcode: QR, value bound to ticket number field
   - Background: `#1A0A10`, foreground: `#F4E9EC`, label: `#FF2B6D`
   - Mark the "status" custom field as push-update enabled.
4. Copy the template ID → `PASSKIT_TEMPLATE_ID`.

### 4. Set up Google Wallet

1. Create a Google Cloud project.
2. Enable the **Google Wallet API**.
3. **IAM & Admin → Service Accounts** → create a service account → generate a JSON key.
4. Copy the **entire JSON file contents** (minified to a single line) into `GOOGLE_WALLET_SERVICE_ACCOUNT_KEY`.
5. Go to [Google Wallet Business Console](https://pay.google.com/business/console/), complete onboarding, and grab your **Issuer ID** → `GOOGLE_WALLET_ISSUER_ID`.
6. In the Business Console, **authorize your service account** as an API user of the issuer account (via service account email).
7. Bootstrap the event ticket class:

   ```bash
   yarn bootstrap:google
   ```

   This will print `GOOGLE_WALLET_CLASS_ID=<value>` — paste into `.env.local`.

### 5. Run locally

```bash
yarn dev
```

Visit [http://localhost:3000](http://localhost:3000). The `/api/health` endpoint reports which providers are configured:

```bash
curl -s http://localhost:3000/api/health | jq
```

## Demo flow (for the pitch)

1. Open `/` on your laptop.
2. Type the client's name. The ticket preview updates live.
3. Hand them your phone, or ask them to scan a QR pointing to the page on theirs.
4. They tap "Add to Apple Wallet" or "Save to Google Wallet" — the pass is added.
5. On your laptop, navigate to `/?admin=1`.
6. Click "Doors Open" → their lockscreen notification fires within a few seconds.
7. Cycle through "Live Now" → "Ended" for the full arc.

## API routes

| Route                       | Method                                             | Purpose                       |
| --------------------------- | -------------------------------------------------- | ----------------------------- |
| `/api/health`               | GET                                                | Per-provider readiness status |
| `/api/generate-apple-pass`  | POST `{ name, tier }`                              | PassKit ticket creation       |
| `/api/generate-google-pass` | POST `{ name, tier }`                              | Google Wallet save JWT        |
| `/api/update-pass`          | POST `{ status, appleTicketId?, googleObjectId? }` | Push update to both providers |

## Deploy to Vercel

```bash
vercel login
vercel link
vercel env add PASSKIT_API_KEY
vercel env add PASSKIT_API_SECRET
vercel env add PASSKIT_TEMPLATE_ID
vercel env add GOOGLE_WALLET_SERVICE_ACCOUNT_KEY
vercel env add GOOGLE_WALLET_ISSUER_ID
vercel env add GOOGLE_WALLET_CLASS_ID
vercel env add NEXT_PUBLIC_APP_ORIGIN   # set to your production URL
vercel --prod
```

For `PASSKIT_API_SECRET`, when prompted, paste the full PEM including newlines — Vercel handles multiline via interactive input, or use:

```bash
vercel env add PASSKIT_API_SECRET production < path/to/key.pem
```

For `GOOGLE_WALLET_SERVICE_ACCOUNT_KEY`, paste the JSON file as a single line:

```bash
jq -c . path/to/service-account.json | vercel env add GOOGLE_WALLET_SERVICE_ACCOUNT_KEY production
```

## Graceful degradation

If only one provider is configured, the app still works — the other button shows a friendly "not configured" message. Useful when demoing with only one account set up.

## Known limitations

- No authentication on `/api/update-pass` — anyone with the URL can push updates. Acceptable for a demo; harden before production.
- No test suite. Smoke-test manually via `/api/health` and the demo flow.
- Single hardcoded event (`lib/brand.ts`). Multi-event would require a data store.
