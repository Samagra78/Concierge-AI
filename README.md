# Concierge AI

Concierge AI is a personal travel planning app for building trips around the way you like to travel. Set your preferences once, use them to shape itineraries and place suggestions, and keep your plans and trip spending together in one workspace. The app also includes an AI concierge chat and a local errands experience.

## Explore the app

### Plan a trip that fits you

Build a Traveler DNA profile with your interests, daily walking limit, budget, preferred comfort level, wake-up time, crowd tolerance, and lifestyle rules. Use those preferences with a destination, trip length, budget, and additional instructions to generate a day-by-day itinerary. Each day is organized into timed activities and travel between stops, with costs, venue details, and alternatives where available.

Keep multiple trips in your workspace, switch between them, and update plans as you go. Lock activities you want to keep, or ask the concierge to replan a time slot around a new preference or remaining budget.

### Discover places

Search a destination for restaurants, cafes, accommodation, attractions, museums, and transport. Suggestions include location details, estimated costs, map links, and preference matches. When configured, Gemini can ground itineraries and chat responses in Google Maps or Search, and the discovery view uses Geoapify place data.

### Keep the trip organized

- **Dashboard:** See the active trip, budget summary, and planning shortcuts.
- **Timeline:** Review each day and its activities and transit in order.
- **Expense tracker:** Record and categorize trip costs, including estimated and prepaid expenses.
- **Traveler profile:** Manage your profile and view trip history.
- **Traveler DNA:** Update the preferences used to tailor suggestions and plans.

Account workspaces persist to MongoDB when signed in. The app also includes seeded example trips, places, and expenses so the interface has sample content to explore.

### Ask the Concierge

Use the multi-turn chat to ask travel questions, explore places, or start an itinerary proposal. Chat can optionally use Maps or Search grounding and display available source links. You can review a proposed itinerary before adding it to your trip workspace.

### Coordinate a local errand

The local errands experience accepts a plain-language request, presents candidate quotes for comparison, and requires explicit approval before a quote can proceed through the approval flow. Payment confirmation records the approved amount in the workspace; the app does not process a real payment.

> **Prototype status:** Demo content is not live travel data. Some place match scores, prices, and expense examples are sample or heuristic values. Gemini and Geoapify features require API keys. Vendor outreach is not fully integrated: Telegram and WhatsApp adapters currently log messages rather than sending them, scheduled follow-ups are placeholders, and automated voice calls are stubbed. Errand quotes should not be treated as confirmed vendor offers.

## Run locally

### Requirements

- Node.js and npm
- MongoDB for accounts and saved workspaces
- Gemini API key for AI chat and itinerary generation
- Geoapify API key for Smart Discovery

### Setup

1. From the repository root, install workspace dependencies:

   ```sh
   npm install
   ```

2. Copy `.env.example` to `.env` in the repository root. Set `MONGODB_URI` and a strong `JWT_SECRET`. Add `GEMINI_API_KEY` and `GEOAPIFY_API_KEY` to enable the corresponding app features. Keep real credentials in `.env`; it is ignored by git.

3. Start the API and frontend in separate terminals from the repository root:

   ```sh
   npm run dev --workspace=@concierge/server
   ```

   ```sh
   npm run dev --workspace=@concierge/client
   ```

   Open `http://localhost:5173`. Vite proxies API requests to the Express server at `http://localhost:3000`. Check server and database status at `http://localhost:3000/api/health`.

The server can start while MongoDB is disconnected, but signing in and saving account data require a working database. Gemini and Geoapify features report configuration errors when their keys are missing.

## Project structure

```text
client/   React, TypeScript, Vite, and Tailwind CSS app
server/   Express API, MongoDB models, Gemini and Geoapify services
shared/   Shared TypeScript types for the errands workflow
```

### App implementation

The client provides landing, authentication, onboarding, dashboard, timeline, Traveler DNA, Smart Discovery, expense tracker, profile, chat, and local errands views. Trip preferences, itinerary plans, expenses, profile data, and trip history are managed in the app workspace and saved for authenticated users.

The server provides authentication, workspace persistence, Gemini chat and itinerary endpoints, Geoapify geocoding and place discovery, and task, quote, approval, and payment-record routes. The shared package defines the errand task lifecycle and domain types. Google ADK root, discovery, negotiation, and booking agent definitions and a capability check are included; external vendor messaging and some scheduling behavior remain prototypes as noted above.

## Configuration

`.env.example` lists all supported settings. The main variables are:

| Variable | Used for |
| --- | --- |
| `APP_PORT` / `PORT` | API server port; defaults to `3000` |
| `CLIENT_URL` | Allowed frontend origin for credentialed API requests |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Authentication token signing secret |
| `GEMINI_API_KEY` | Gemini chat and itinerary generation |
| `GEMINI_MODEL` | Preferred Gemini model |
| `GEOAPIFY_API_KEY` | Geocoding and Smart Discovery place search |
| `GOOGLE_PLACES_API_KEY` | Google Places configuration for server services |
| `DEFAULT_CURRENCY` | Default errands currency; defaults to `INR` |
| `OUTBOUND_MESSAGING_ENABLED` | Global outbound messaging policy switch |
| `MAX_NEGOTIATION_ROUNDS`, `VENDORS_PER_TASK`, `APPROVAL_TTL_MINUTES` | Errand workflow policy limits |
| `TELEGRAM_*`, `WHATSAPP_*` | Webhook and channel configuration |

## Commands

Run from the repository root:

| Command | Description |
| --- | --- |
| `npm run build` | Build shared types, server, and client |
| `npm run lint` | TypeScript checks for all workspaces |
| `npm test` | Run the configured Traveler DNA utility tests |
| `npm run check-adk` | Check installed Google ADK TypeScript capabilities |
| `npm run seed-admin --workspace=@concierge/server` | Create or update an admin account; requires `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and MongoDB |

## API reference

The server mounts routes under `/api` and at the root. The frontend uses `/api`.

| Area | Routes |
| --- | --- |
| Health | `GET /api/health` |
| Accounts and workspace | `/api/auth` - register, login, logout, current user, preferences, profile, workspace |
| Errand tasks | `/api/tasks` - create, list, view, message, quotes, cancel, payment confirmation |
| Quote approvals | `/api/approvals/:id/grant`, `/api/approvals/:id/reject` |
| AI and places | `POST /api/chat`, `POST /api/itinerary/generate`, `POST /api/itinerary/replan-slot`, `/api/places/*` |
| Errand dispatch | Authenticated `POST /api/errands/outreach` |
| Channel webhooks | `/api/webhooks/telegram`, `/api/webhooks/whatsapp` |

The configured automated test command currently covers `client/src/utils/travelerDna.test.ts`; server and UI test suites are not configured.

## License

Source files contain Apache-2.0 license headers. Confirm the intended repository-wide license before redistribution.
