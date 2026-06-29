# Project Memory & Decisions

## Key Architectural Decisions
- **App Router**: Next.js App Router is used. All dynamic pages and server-side routes are inside `src/app/`.
- **Hybrid Data Persistence**:
  - **Remote Sync (Turso SQL Database)**: Todos, Streaks, Notes, Journal entries, and Habits tracker data (habit definitions + logs) are stored in a cloud-hosted Turso database. Data synchronization runs asynchronously in the background. If a write fails (e.g. offline status), the changes are rolled back in the Zustand state and a visible error toast is displayed via Sonner. No complex offline queueing or merge replica is configured to maintain codebase simplicity.
  - **Local-Only (localStorage)**: User settings (Primary Accent color label) and Location details (latitude, longitude, city name, country) remain strictly stored in local storage to optimize access speeds and prevent cross-device settings collision.
- **SSR Hydration Guarding**: Since the application renders client-side values and requires loading records from the database on mount, components rely on the `useHydrated` custom hook or loading boundaries. During initial page loading, a skeleton loader is displayed, preventing React hydration mismatch warnings.
- **View Tab Switcher**: A custom glassmorphic segmented tab selection controller swaps the primary home content between "Tasks", "Notes", "Journal", and "Habits" views, maintaining a clean, single-screen dashboard layout.

## Visual Language & Design Standards (Tasks Reference Standard)
- **Cards**: Elements use a standard layout of `rounded-2xl`, border definitions `border-white/50 dark:border-white/5 bg-white/70 dark:bg-white/[0.03]`, and hover actions `hover:shadow-md hover:bg-white dark:hover:bg-white/[0.05]`.
- **Micro-animations**: Cards use `anim-lift` classes to animate hover state coordinates.
- **Framer Motion Springs**: List transitions are standardized to spring animations `{ type: "spring", stiffness: 350, damping: 28 }`, and items fade and slide left on deletion (`exit={{ opacity: 0, x: -16 }}`).
- **Form Composers**: Composer card forms use `rounded-3xl border-white/40 dark:border-white/10 bg-white/60 dark:bg-white/[0.03] backdrop-blur-xl p-4 sm:p-5 shadow-sm`.
- **Icon Adornments**: Input fields include a prominent themed icon wrapper in a colored container (e.g. `Plus` in Tasks, `BookOpen` in Journal, `Activity` in Habits) to structure inputs visually.
- **Buttons**: Action and primary submit buttons utilize `rounded-xl`, h-10 sizes, and a `font-medium` (not `font-semibold`) typography weight.

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
- **Notes Table**: Stores persistent notes data:
  - `id` (text, primary key)
  - `title` (text, not null)
  - `content` (text, not null)
  - `created_at` (integer, timestamp)
  - `updated_at` (integer, timestamp)
- **Journal Entries Table**: Stores journal entries data with optional images:
  - `id` (text, primary key)
  - `content` (text, not null)
  - `mood` (text, nullable, reserved for future use)
  - `image_urls` (text, JSON array of Cloudinary secure URLs)
  - `created_at` (integer, timestamp)
  - `updated_at` (integer, timestamp)
- **Habits Table**: Stores habit tracker definitions:
  - `id` (text, primary key)
  - `name` (text, not null)
  - `target_count` (integer, nullable, target amount of repetitions)
  - `unit` (text, nullable, unit descriptor e.g. "glasses", "minutes")
  - `created_at` (integer, timestamp)
  - `archived` (integer, 0/1 indicator to hide definitions without purging statistics history)
- **Habit Logs Table**: Tracks daily completed repetitions per habit:
  - `id` (text, primary key)
  - `habit_id` (text, foreign pointer)
  - `date` (text, YYYY-MM-DD)
  - `count` (integer, completed repetitions for the day)
  - `created_at` (integer, timestamp)
  - Unique Constraint: `UNIQUE(habit_id, date)` to support SQL upsert commands.

## Shared-Secret Authentication & Same-Origin Trust
- Backend API routes under `/api/todos`, `/api/streak`, `/api/notes`, `/api/journal`, and `/api/habits` validate requests based on origin source:
  - **Same-Origin Requests**: Browser client requests originating from the app are automatically trusted. This is validated by verifying `sec-fetch-site === "same-origin"` or comparing request `referer` host with `host` headers.
  - **External Requests**: Requests coming from external endpoints (e.g. iOS Shortcuts, Postman, curl) are authenticated against the server-only `PERSONAL_API_TOKEN` environment variable via the `Authorization: Bearer <PERSONAL_API_TOKEN>` header.
- **Security Tradeoffs Choice**:
  - We elected to **automatically trust same-origin calls** instead of inject/bundle tokens.
  - *Tradeoffs*:
    - **Pros**: Client-side Javascript does not contain or bundle secret keys, entirely eliminating leaks of sensitive variables in production builds. Keeps frontend config simple.
    - **Cons**: If specific browser extensions or proxy settings strip referers/sec-fetch headers, browser requests could fail authentication. However, standard browsers default to sending these parameters for normal web app fetch operations.

## Cloudinary Image Upload Architecture
- **Signed Server-Side Uploads**: Rather than performing unsigned client-side uploads directly from the browser, we route all image uploads through our Next.js API endpoint `/api/journal/upload`.
  - **Security Rationale**: Unsigned uploads require storing an upload preset on the client side, which allows public access to write/modify images in Cloudinary. To protect the storage, signed uploads are utilized.
  - **Implementation**: The server computes a secure SHA-1 signature using `CLOUDINARY_API_SECRET` and forwards the payload directly using standard Node `crypto` algorithms. The API secret remains strictly server-side, preventing front-end credential leaks.

## Smart Features & Integration Detail
- **Natural Language Parsing (NLP)**: Task input parses text for priority, category, tags, estimates, and deadlines, automatically stripping matching words to format clean titles.
- **Daily Completed Streak**: Calculated by finding consecutive completed days starting from today or yesterday (grace period). The completions list is loaded once from the database. A loading guard in `useStreakWatcher` prevents the watcher from double-triggering completed states during initial load.
- **Weather-Aware System**: Geocoding APIs are fetched via Nominatim and Open-Meteo. The client checks weather parameters every 60 seconds.
