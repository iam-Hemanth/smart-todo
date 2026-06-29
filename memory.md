# Project Memory & Decisions

## Key Architectural Decisions
- **App Router**: Next.js App Router is used. All dynamic pages and server-side routes are inside `src/app/`.
- **Hybrid Data Persistence**:
  - **Remote Sync (Turso SQL Database)**: Todos and Streaks data are stored in a cloud-hosted Turso database. Data synchronization runs asynchronously in the background. If a write fails (e.g. offline status), the changes are rolled back in the Zustand state and a visible error toast is displayed via Sonner. No complex offline queueing or merge replica is configured to maintain codebase simplicity.
  - **Local-Only (localStorage)**: User settings (Primary Accent color label) and Location details (latitude, longitude, city name, country) remain strictly stored in local storage to optimize access speeds and prevent cross-device settings collision.
- **SSR Hydration Guarding**: Since the application renders client-side values and requires loading records from the database on mount, components rely on the `useHydrated` custom hook or loading boundaries. During initial page loading, a skeleton loader is displayed, preventing React hydration mismatch warnings.

## Database Schema Choices
- **Todos Table**: Structures tasks using columns matching the `Todo` interface properties:
  - `id` (text, primary key)
  - `text` (text, not null)
  - `category` (text)
  - `priority` (text)
  - `completed` (integer, 0/1)
  - `created_at` (integer, timestamp)
  - `completed_at` (integer, nullable)
  - `due_date` (text, nullable YYYY-MM-DD)
  - `tags` (text, JSON array string)
  - `notes` (text, nullable)
  - `estimate_minutes` (integer, nullable)
  - `color` (text, nullable)
  - `subtasks` (text, JSON array string)
  - `sort_order` (integer, preserves drag-and-drop array list ordering)
- **Streak Days Table**: Records calendar completions in a single column table:
  - `day` (text, primary key, YYYY-MM-DD format). Inserts are idempotent (`INSERT OR IGNORE`).

## Shared-Secret Authentication & Same-Origin Trust
- Backend API routes under `/api/todos` and `/api/streak` validate requests based on origin source:
  - **Same-Origin Requests**: Browser client requests originating from the app are automatically trusted. This is validated by verifying `sec-fetch-site === "same-origin"` or comparing request `referer` host with `host` headers.
  - **External Requests**: Requests coming from external endpoints (e.g. iOS Shortcuts, Postman, curl) are authenticated against the server-only `PERSONAL_API_TOKEN` environment variable via the `Authorization: Bearer <PERSONAL_API_TOKEN>` header.
- **Security Tradeoffs Choice**:
  - We elected to **automatically trust same-origin calls** instead of inject/bundle tokens.
  - *Tradeoffs*:
    - **Pros**: Client-side Javascript does not contain or bundle secret keys, entirely eliminating leaks of sensitive variables in production builds. Keeps frontend config simple.
    - **Cons**: If specific browser extensions or proxy settings strip referers/sec-fetch headers, browser requests could fail authentication. However, standard browsers default to sending these parameters for normal web app fetch operations.

## Smart Features & Integration Detail
- **Natural Language Parsing (NLP)**: Task input parses text for priority, category, tags, estimates, and deadlines, automatically stripping matching words to format clean titles.
- **Daily Completed Streak**: Calculated by finding consecutive completed days starting from today or yesterday (grace period). The completions list is loaded once from the database. A loading guard in `useStreakWatcher` prevents the watcher from double-triggering completed states during initial load.
- **Weather-Aware System**: Geocoding APIs are fetched via Nominatim and Open-Meteo. The client checks weather parameters every 60 seconds.
