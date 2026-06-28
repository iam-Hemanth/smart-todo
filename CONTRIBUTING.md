# Contributing to Smart To-Do

Thanks for your interest in contributing! This project is a passion project and all contributions are welcome.

## 🚀 Getting Started

1. **Fork** the repository on GitHub
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/smart-todo.git
   cd smart-todo
   ```
3. **Install** dependencies:
   ```bash
   npm install
   ```
4. **Set up** the environment:
   ```bash
   cp .env.example .env
   ```
5. **Start** the dev server:
   ```bash
   npm run dev
   ```
6. Open [http://localhost:3000](http://localhost:3000)

## 🛠️ Development

### Code Style
- **TypeScript** throughout — no `any` types unless absolutely necessary
- **ESLint** — run `npm run lint` before committing
- **Prettier** formatting is enforced via ESLint
- Use **conventional commit messages** (e.g., `feat: add new weather scene`, `fix: cloud teleport issue`)

### Project Structure
- `src/app/` — Next.js App Router pages and API routes
- `src/components/` — React components (organized by feature)
- `src/components/ui/` — shadcn/ui base components (don't edit directly)
- `src/hooks/` — Custom React hooks
- `src/lib/` — Utilities and helpers
- `src/store/` — Zustand state stores

### Adding a New Weather Scene

1. Open `src/components/weather/weather-effects.tsx`
2. Add your scene to the `Scene` type and `classifyScene()` function
3. Create a new scene component (e.g., `MyNewScene`)
4. Add it to the render switch in `WeatherEffects`
5. Add the matching gradient in `getSceneGradient()` in `weather-card.tsx`

### Adding a New Feature

1. Create components in `src/components/`
2. Add state to the appropriate Zustand store in `src/store/`
3. Use existing shadcn/ui components where possible
4. Ensure light/dark mode compatibility
5. Test on mobile (390px) and desktop (1280px)

## 🧪 Testing

Currently this project doesn't have automated tests. If you'd like to add them:
- [Vitest](https://vitest.dev) for unit tests
- [Playwright](https://playwright.dev) for E2E tests
- [Testing Library](https://testing-library.com) for component tests

## 📝 Pull Request Process

1. **Create a branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. **Make your changes** and commit with clear messages
3. **Test thoroughly** — check light/dark mode, mobile/desktop, different weather conditions
4. **Run lint**:
   ```bash
   npm run lint
   ```
5. **Push** to your fork and open a PR against `main`
6. **Describe** what your PR does and link any related issues

### PR Checklist
- [ ] Code follows the existing style
- [ ] `npm run lint` passes with no errors
- [ ] Works in both light and dark mode
- [ ] Works on mobile (390px) and desktop (1280px)
- [ ] No console errors
- [ ] Commit messages follow conventional commits

## 🐛 Reporting Bugs

When reporting bugs, please include:
1. **Steps to reproduce** the issue
2. **Expected** vs **actual** behavior
3. **Screenshots** if applicable
4. **Browser** and **OS** you're using
5. **Weather condition** and **location** if it's weather-related

## 💡 Suggesting Features

Feature requests are welcome! Please:
1. Check if the feature has already been requested
2. Describe the feature and why it would be useful
3. Include any mockups or examples if possible

## 📜 Code of Conduct

Be respectful and constructive. We're all here to build something cool together.

---

Thanks for contributing! 🎉
