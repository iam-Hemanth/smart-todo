# Repository Audit Report: Smart To-Do

This document provides a detailed, plain-English report auditing the **Smart To-Do** Next.js codebase. No source files have been modified.

---

## 1. App Router vs. Pages Router
This project uses the **Next.js App Router** structure. All application routing, page layouts, and API routes reside inside the `src/app/` directory:
- The main user interface is served by the client component at `src/app/page.tsx`.
- The HTML shell and initial providers wrapper are located in `src/app/layout.tsx`.
- API endpoints are structured under `src/app/api/`.

---

## 2. To-Do List Architecture & Logic
The to-do list features a local-first architecture managed using [Zustand](https://github.com/pmndrs/zustand) for state-management and client-side persistence. Below is the list of all files involved in the task management pipeline and what they do:

### State Management & Storage
*   **[todo-store.ts](file:///Users/hemanth/Downloads/Smart-To-Do/src/store/todo-store.ts)**:
    This is the core state store of the application. It defines the structure of a `Todo` (e.g., ID, text, category, priority, due date, tags, notes, subtasks, color, estimate, and completion timestamps) and the `TodoState` interface. It provides actions to add, edit, delete, toggle, and reorder tasks, and handles subtask operations (`addSubtask`, `toggleSubtask`, `deleteSubtask`). It uses Zustand's `persist` middleware to sync state with `localStorage`.

### User Interface Components
*   **[todo-list.tsx](file:///Users/hemanth/Downloads/Smart-To-Do/src/components/todos/todo-list.tsx)**:
    Subscribes to filtered tasks using the `useFilteredTodos` hook and maps them to animatable `TodoItem` items. It also renders custom illustrations and empty states depending on which filter (All, Active, Done, Overdue, Indoor, Outdoor) is currently active.
*   **[todo-item.tsx](file:///Users/hemanth/Downloads/Smart-To-Do/src/components/todos/todo-item.tsx)**:
    Renders an individual task card. It contains check/uncheck animations, tags display, due date countdowns, subtasks list expansion, inline notes, drag handle graphics, a double-click text editor, and triggers a dynamic blue "Rain Warning" badge for outdoor tasks if it is raining. It also displays a pulsing red banner if a task is overdue.
*   **[add-todo.tsx](file:///Users/hemanth/Downloads/Smart-To-Do/src/components/todos/add-todo.tsx)**:
    Provides the task input bar. It processes text in real-time to show visual "Smart Parse" hints of parsed fields. Users can expand an options panel to manually configure category (Indoor/Outdoor), priority (Low, Medium, High), due date (via a calendar), duration estimate buttons, tag management, color labels, and extra text notes.
*   **[filter-tabs.tsx](file:///Users/hemanth/Downloads/Smart-To-Do/src/components/todos/filter-tabs.tsx)**:
    Renders the filters segment bar. It displays counts of active, completed, overdue, outdoor, and indoor tasks next to their labels and highlights the active selection.
*   **[stats-bar.tsx](file:///Users/hemanth/Downloads/Smart-To-Do/src/components/todos/stats-bar.tsx)**:
    Renders progress stats at the top of the list, showing a percentage progress bar, task counts, an "All clear!" celebration banner when all tasks are complete, and a "Clear done" button to delete completed tasks.
*   **[today-summary-pill.tsx](file:///Users/hemanth/Downloads/Smart-To-Do/src/components/today-summary-pill.tsx)**:
    Generates horizontal summary pills below the input bar highlighting urgent task details, such as total active tasks, tasks due today, overdue tasks, and a warning if outdoor tasks are scheduled while it is raining.

### Helper & Utilities Libraries
*   **[nlp-parser.ts](file:///Users/hemanth/Downloads/Smart-To-Do/src/lib/nlp-parser.ts)**:
    A utility containing regex patterns to parse natural language text inputs. It scans for hashtags (e.g., `#work`), priority keywords (`high`, `urgent`, `low`), category keywords (`outdoor`, `run`, `inside`), duration estimates (`30min`, `2h`), and date keywords (`today`, `tomorrow`, `next week`, `monday`). It extracts these fields and cleans the final task title by stripping out the parsed keywords.
*   **[todo-helpers.ts](file:///Users/hemanth/Downloads/Smart-To-Do/src/lib/todo-helpers.ts)**:
    Provides formatting definitions and theme class lookups for todo properties, including `getDueDateInfo` (which computes whether a date is overdue, due today, or due soon), a Tailwind gradient mapper (`COLOR_MAP`) for custom todo color labels, and a deterministic hash function (`getTagColor`) that styles tags consistently based on their names.

### Custom React Hooks
*   **[use-hydrated.ts](file:///Users/hemanth/Downloads/Smart-To-Do/src/hooks/use-hydrated.ts)**:
    Gates rendering until the client component has successfully mounted. Since tasks are stored in `localStorage`, this hook prevents server-side rendering (SSR) and client-side rendering (CSR) content mismatches.
*   **[use-confetti-on-all-done.ts](file:///Users/hemanth/Downloads/Smart-To-Do/src/hooks/use-confetti-on-all-done.ts)**:
    Subscribes to `useTodoStore` changes and fires a burst of confetti using the `canvas-confetti` package whenever the task completion percentage transitions to 100%.

---

## 3. LocalStorage Usage & Exact Keys
LocalStorage is used to persist user data and UI choices directly in the browser. The following exact keys are used:

1.  **`"smart-todo:v2"`** (Read/Written in `src/store/todo-store.ts`):
    *   **How it is used**: Handled by Zustand's `persist` middleware. It stores the array of `todos` and the active `filter` setting.
    *   **Data Structure**:
        ```json
        {
          "state": {
            "todos": [...],
            "filter": "all"
          },
          "version": 2
        }
        ```
2.  **`"smart-todo-location:v1"`** (Read/Written in `src/store/location-store.ts`):
    *   **How it is used**: Handled by Zustand's `persist` middleware. It stores the user's selected location name, coordinates (latitude, longitude), and country code to fetch weather details.
    *   **Data Structure**:
        ```json
        {
          "state": {
            "location": {
              "name": "Kittaganuru",
              "admin1": "Karnataka",
              "country": "India",
              "country_code": "IN",
              "lat": 13.0373,
              "lon": 77.7105,
              "timezone": "Asia/Kolkata"
            }
          },
          "version": 2
        }
        ```
3.  **`"smart-todo-streak:v1"`** (Read/Written in `src/components/streak-badge.tsx`):
    *   **How it is used**: Handled by Zustand's `persist` middleware. It stores the completion calendar history (list of dates) to calculate active streaks.
    *   **Data Structure**:
        ```json
        {
          "state": {
            "completionDays": ["2026-06-29", "2026-06-28"]
          },
          "version": 0
        }
        ```
4.  **`"smart-todo-accent:v1"`** (Read/Written in `src/components/accent-picker.tsx`):
    *   **How it is used**: Read and written directly via native browser `localStorage.getItem` and `localStorage.setItem`. It saves the custom theme primary accent color chosen by the user (e.g., `emerald`, `violet`, `rose`, `amber`, `sky`, `slate`).
5.  **`"theme"`** (Read/Written in `src/app/layout.tsx`):
    *   **How it is used**: Implicitly managed by the `next-themes` package wrapper `<ThemeProvider>` to store the user's dark/light preference (`"light"` or `"dark"`).

---

## 4. Streak-Tracking Logic & Calculation
The streak-tracking system rewards users for completing tasks daily. The logic is divided between two files:

*   **Watcher Hook ([use-streak-watcher.ts](file:///Users/hemanth/Downloads/Smart-To-Do/src/hooks/use-streak-watcher.ts))**:
    Subscribes to changes in `useTodoStore`. It maintains an in-memory `Set` of task IDs that are already completed. When a task transitions from incomplete to complete (its `completedAt` timestamp is newly set), the watcher calls the `record()` function in `useStreakStore`.
*   **Streak Store & Calculations ([streak-badge.tsx](file:///Users/hemanth/Downloads/Smart-To-Do/src/components/streak-badge.tsx))**:
    *   **Recording completion days**: The `record()` function converts the current client Date object into an ISO string format (`YYYY-MM-DD` in UTC) and appends it to `completionDays` if it is not already present.
    *   **Calculating the streak (`computeStreak`)**:
        1. It turns the list of completed dates into a unique lookup `Set`.
        2. It creates Date objects for `today` (start of day at midnight) and `yesterday` (24 hours prior).
        3. To offer a grace period, it checks whether `today` is in the set. If yes, it starts checking from today. If no, but `yesterday` is in the set, it starts checking from yesterday (this prevents the streak from breaking if a user hasn't completed their first task of the new day yet; it only breaks after 48 hours without task completion). If neither day contains a completion, it returns `0`.
        4. It uses a cursor Date starting from today or yesterday, decrements the cursor day-by-day (subtracting 86,400,000 ms per iteration), and checks whether the cursor's ISO date exists in the lookup set.
        5. It increments the streak count for each matching date and stops as soon as it hits a day without a task completion. It then returns the calculated streak number.

---

## 5. Weather & AQI Fetching & Backend API Routes
Weather awareness enables the app to display animated conditions and flag outdoor tasks when it is raining.

### Backend API Routes (`src/app/api/`)
*   **`/api/weather` ([weather/route.ts](file:///Users/hemanth/Downloads/Smart-To-Do/src/app/api/weather/route.ts))**:
    This is an Edge Runtime API. It accepts `lat` and `lon` query params. It initiates concurrent fetches to:
    1.  **Open-Meteo Forecast API** (`https://api.open-meteo.com/v1/forecast`) for variables like current temperature, relative humidity, apparent temperature, day/night code, wind speed, precipitation depth, weather code, and an 8-hour forecast.
    2.  **Open-Meteo Air Quality API** (`https://air-quality-api.open-meteo.com/v1/air-quality`) to retrieve US EPA AQI, PM2.5, PM10, ozone, nitrogen dioxide, and sulphur dioxide.
    It implements an in-memory `Map` fallback cache (`aqiCache`) with a 30-minute Time-To-Live (TTL) for AQI results so transient network failures do not cause the UI to flicker. It returns cache headers allowing 60 seconds of client freshness.
*   **`/api/geocode` ([geocode/route.ts](file:///Users/hemanth/Downloads/Smart-To-Do/src/app/api/geocode/route.ts))**:
    An Edge Runtime API that searches coordinates for a city query string (`q`). It queries **OpenStreetMap Nominatim API** (`https://nominatim.openstreetmap.org/search`) and **Open-Meteo Geocoding Search** (`https://geocoding-api.open-meteo.com/v1/search`), cleaning and sorting the suggestions by type priority and population importance.
*   **`/api/reverse-geocode` ([reverse-geocode/route.ts](file:///Users/hemanth/Downloads/Smart-To-Do/src/app/api/reverse-geocode/route.ts))**:
    An Edge Runtime API that resolves coordinates to a localized name. It queries **OpenStreetMap Nominatim Reverse API** (`https://nominatim.openstreetmap.org/reverse`) with a zoom level of 10 (city/suburb-level resolution). On failure, it falls back to **BigDataCloud's Reverse Geocoding Client** API.
*   **`/api` ([route.ts](file:///Users/hemanth/Downloads/Smart-To-Do/src/app/api/route.ts))**:
    A default status route returning `{"message": "Hello, world!"}`.

### Client-Side Weather Fetching Hook
*   **[use-bangalore-weather.ts](file:///Users/hemanth/Downloads/Smart-To-Do/src/hooks/use-bangalore-weather.ts)**:
    Defines the `useWeather(lat, lon)` hook. It performs the fetch requests to the internal `/api/weather` route. It sets up a client-side `setInterval` loop that updates the weather data every 60 seconds (1 minute) to keep weather states and alerts synchronized.

---

## 6. npm Dependencies Analysis (Non-Default)
Here is every package listed in `package.json` that is not a default Next.js, React, or TailwindCSS setup dependency:

### Production Dependencies (`dependencies`):
1.  `@hookform/resolvers`: Connects validation schema libraries like Zod to React Hook Form.
2.  `@radix-ui/react-accordion`: Unstyled, accessible accordion component primitive.
3.  `@radix-ui/react-alert-dialog`: Accessible modal alert overlay primitive.
4.  `@radix-ui/react-aspect-ratio`: Forces specific width/height ratios for media and boxes.
5.  `@radix-ui/react-avatar`: Circular avatar image container with image fallback primitives.
6.  `@radix-ui/react-checkbox`: Accessible interactive checkbox form control.
7.  `@radix-ui/react-collapsible`: Accessible container that expands or collapses.
8.  `@radix-ui/react-context-menu`: Customized menu appearing upon right-click.
9.  `@radix-ui/react-dialog`: Base accessible modal dialog overlay components.
10. `@radix-ui/react-dropdown-menu`: Floating dropdown list buttons.
11. `@radix-ui/react-hover-card`: Popup card that reveals contents when hovered (used for the AQI hover cards).
12. `@radix-ui/react-label`: Accessible labels linked to inputs.
13. `@radix-ui/react-menubar`: Accessible application menu system layout.
14. `@radix-ui/react-navigation-menu`: Navigation bar lists with flyout panels.
15. `@radix-ui/react-popover`: Interactive popovers triggered by click events.
16. `@radix-ui/react-progress`: Percentage-filled bar showing loading or completion stats.
17. `@radix-ui/react-radio-group`: Accessible radio buttons lists.
18. `@radix-ui/react-scroll-area`: Custom-styled cross-browser scrollbar wrapper.
19. `@radix-ui/react-select`: Styled options dropdown selector.
20. `@radix-ui/react-separator`: Visual divider lines.
21. `@radix-ui/react-slider`: Interactive numeric range selection slider.
22. `@radix-ui/react-slot`: Allows custom components to merge classes with child components.
23. `@radix-ui/react-switch`: Accessible toggling switch element.
24. `@radix-ui/react-tabs`: Accessible tabs list for switching panels.
25. `@radix-ui/react-toast`: Temporary banner notifications popping onto screens.
26. `@radix-ui/react-toggle`: Styled toggle buttons that record true/false.
27. `@radix-ui/react-toggle-group`: Group of toggle buttons allowing mutually exclusive selections.
28. `@radix-ui/react-tooltip`: Context info tooltips shown on element hover.
29. `canvas-confetti`: High-performance, canvas-based confetti bursts.
30. `class-variance-authority`: Standardized CSS variations setup tool.
31. `clsx`: Utility to conditionally merge CSS class string inputs.
32. `cmdk`: Fast keyboard-navigable command menu overlay.
33. `date-fns`: Date calculation, comparison, and formatting library.
34. `framer-motion`: Physics-based React animation and layout transition library.
35. `input-otp`: Text entry formatting utility for multi-digit passcodes.
36. `lucide-react`: Lightweight SVG icons bundle.
37. `next-themes`: Theme customizer providing Dark/Light configurations.
38. `react-day-picker`: Calendar UI component library for selecting dates.
39. `react-hook-form`: Flexible forms validation state container.
40. `react-resizable-panels`: Interactive drag-resizable dashboard layouts.
41. `recharts`: D3-based charting components (for dashboard stats).
42. `sonner`: Sleek, animated toast notification manager.
43. `tailwind-merge`: Resolves Tailwind class overrides safely.
44. `tailwindcss-animate`: Transitions preset plugin for Tailwind CSS.
45. `uuid`: Safe cryptographically-random UUID generator.
46. `vaul`: Smooth bottom drawers for drawers on mobile.
47. `zod`: TypeScript-first schema and validation validator.
48. `zustand`: Super-fast, lightweight central state store.

### Development Dependencies (`devDependencies`):
49. `@types/canvas-confetti`: TypeScript definitions for the `canvas-confetti` package.
50. `tw-animate-css`: Precompiled CSS transition keyframes classes for Tailwind.

---

## 7. Folder Structure (3 Levels Deep)

```
Smart-To-Do/
├── .github/                       # GitHub configurations and workflows
├── public/                         # Static assets like screenshots, logo, and search configs
│   ├── hero-mobile.png
│   ├── hero-screenshot.png
│   ├── logo.svg
│   └── robots.txt
├── src/                            # Main application source code
│   ├── app/                        # Next.js App Router folders & files
│   │   ├── api/                    # Server-side API routes
│   │   ├── globals.css             # Global stylesheets and tailwind layout styles
│   │   ├── layout.tsx              # Root layout wrapping the application pages
│   │   └── page.tsx                # Home page component
│   ├── components/                 # React component modules
│   │   ├── todos/                  # Todo list specific subcomponents
│   │   ├── ui/                     # Generic reusable Shadcn UI components
│   │   ├── weather/                # Weather display components & animations
│   │   ├── accent-picker.tsx       # Accent theme color selector component
│   │   ├── keyboard-shortcuts.tsx  # Keyboard shortcuts configuration overlay
│   │   ├── streak-badge.tsx        # Flame icon and completion history calendar
│   │   ├── theme-toggle.tsx        # Toggle button for switching between Light/Dark mode
│   │   ├── today-summary-pill.tsx  # Summary pills showing current state of tasks
│   │   └── weather-card.tsx        # Current weather details and conditions display
│   ├── hooks/                      # Custom React hooks
│   │   ├── use-bangalore-weather.ts # Hook to fetch weather & forecast data from api
│   │   ├── use-confetti-on-all-done.ts # Celebration confetti trigger when 100% is reached
│   │   ├── use-hydrated.ts         # Prevent hydration errors on initial load
│   │   ├── use-mobile.ts           # Detect if screen size is mobile
│   │   ├── use-streak-watcher.ts   # Track tasks completion times to increase streak days
│   │   └── use-toast.ts            # Shadcn Toast state manager hook
│   ├── lib/                        # Utility functions and helpers
│   │   ├── aqi.ts                  # EPA AQI severity and alert mapper
│   │   ├── nlp-parser.ts           # Natural language task text extractor
│   │   ├── todo-helpers.ts         # Visual helpers like tags colors and due dates tags styling
│   │   ├── utils.ts                # Standard tailwind merger utility
│   │   └── weather.ts              # WMO codes mapping definitions
│   └── store/                      # Zustand state stores
│       ├── location-store.ts       # Coordinates and city name manager
│       └── todo-store.ts           # Main store for tasks CRUD operations
```
