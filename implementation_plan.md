# CoreTracker v2.0 — Premium UI Overhaul with ExerciseDB Integration

The existing CoreTracker app has a functional MVP (Vite + React + TailwindCSS + Framer Motion) with Onboarding, Home, Plank Timer, Exercises, and Progress pages. The goal is to transform it into a stunning, premium fitness app by integrating the requested UI libraries and implementing the full v2.0 spec from the documentation.

## User Review Required

> [!IMPORTANT]
> **UI Libraries Integration Strategy:**
> - **Magic UI NumberTicker** — Will be vendored (copy source into project) since the official install uses `shadcn` CLI which requires a full shadcn setup we don't have. The component is lightweight (uses `framer-motion` which we already have).
> - **ReactBits Dock** — Will replace the current bottom navigation with a macOS-style magnifying dock. Vendored from the GitHub source (uses `motion/react` — we'll adapt to `framer-motion`).
> - **ReactBits GlassIcons** — Will be used on the Home page for the workout action cards (Prancha, Exercícios) and in the Exercises listing. Vendored from GitHub source.
> - **UIverse glass-icons** — UIverse provides individual CSS snippets, not a library. We'll incorporate glass-morphism styling inspired by UIverse into our GlassIcons and card designs.

> [!WARNING]
> The Dock component from ReactBits uses `motion/react` imports. Since our project uses `framer-motion@^11.5.4`, we'll adapt the imports to use `framer-motion` directly — the API is identical.

## Open Questions

> [!IMPORTANT]
> **ExerciseDB API:** The OSS API at `https://oss.exercisedb.dev` may have rate limits or be unavailable. Should we implement the API integration now with a fallback to static data, or keep the current static exercise list and prepare the API integration structure for later? **Plan below assumes: integrate API now with offline fallback to the static exercise list.**

## Proposed Changes

### Component Library — Vendored UI Components

We'll add the three requested UI component libraries as vendored source files (copy-paste into our project), adapted for our tech stack.

#### [NEW] [NumberTicker.tsx](file:///c:/Users/I7%207700K/Downloads/188a2d4d-60c8-495b-9dd0-0a8da52c6e43/src/components/ui/NumberTicker.tsx)
- Animated number counter from Magic UI, using `framer-motion`'s `useSpring` and `useInView`
- Props: `value`, `direction`, `delay`, `decimalPlaces`, `startValue`
- Used in: Home (weekly stats), Progress (streak, PR, volume numbers)

#### [NEW] [Dock.tsx](file:///c:/Users/I7%207700K/Downloads/188a2d4d-60c8-495b-9dd0-0a8da52c6e43/src/components/ui/Dock.tsx)
- macOS-style magnifying dock navigation from ReactBits
- Adapted from `motion/react` → `framer-motion` imports
- Themed to match our dark app palette (`#0F0F14`, `#1A1A24`, `#2A2A3A`)
- Active item gets an amber glow indicator

#### [NEW] [Dock.css](file:///c:/Users/I7%207700K/Downloads/188a2d4d-60c8-495b-9dd0-0a8da52c6e43/src/components/ui/Dock.css)
- Dock styles adapted for our app's color scheme and mobile-first layout

#### [NEW] [GlassIcons.tsx](file:///c:/Users/I7%207700K/Downloads/188a2d4d-60c8-495b-9dd0-0a8da52c6e43/src/components/ui/GlassIcons.tsx)
- Glass-morphism icon buttons from ReactBits
- 3D perspective tilt effect with glassmorphism overlay
- Custom gradient mapping for our app's amber/teal palette

#### [NEW] [GlassIcons.css](file:///c:/Users/I7%207700K/Downloads/188a2d4d-60c8-495b-9dd0-0a8da52c6e43/src/components/ui/GlassIcons.css)
- Glass icon styles with custom app theming

---

### Layout & Navigation

#### [MODIFY] [Layout.tsx](file:///c:/Users/I7%207700K/Downloads/188a2d4d-60c8-495b-9dd0-0a8da52c6e43/src/components/Layout.tsx)
- Replace the current simple bottom nav with the **ReactBits Dock** component
- Dock items: Home (🏠), Prancha (⏱️), Exercícios (💪), Progresso (📊)
- Active item highlighted with amber glow
- Magnification effect on hover/touch

---

### Home Page — Premium Dashboard

#### [MODIFY] [Home.tsx](file:///c:/Users/I7%207700K/Downloads/188a2d4d-60c8-495b-9dd0-0a8da52c6e43/src/pages/Home.tsx)
- **Streak counter**: Replace static number with animated `NumberTicker` and fire emoji animation
- **Weekly summary cards**: Use `NumberTicker` for plank seconds and exercise reps
- **Workout suggestion cards**: Replace with **GlassIcons** for "Prancha Diária" and "Fortalecimento Core"
- **Daily tip section**: Add a "Dica do Dia" card with a glassmorphic design, pulling from exercise tips
- **Greeting**: Add a subtle gradient text animation
- **Background**: Add subtle ambient gradient orbs for depth

---

### Progress Page — Enhanced Visualizations

#### [MODIFY] [Progress.tsx](file:///c:/Users/I7%207700K/Downloads/188a2d4d-60c8-495b-9dd0-0a8da52c6e43/src/pages/Progress.tsx)
- **Streak & PR cards**: Animate values with `NumberTicker`
- **Heatmap**: Improve with smoother gradients, tooltip on hover, and ambient glow
- **Volume cards**: Add weekly/monthly toggle with `NumberTicker` animated values
- Add **Radar Chart** (using Recharts' `RadarChart`) for muscle balance visualization
- Cards use glassmorphism styling (backdrop-blur, translucent backgrounds)

---

### Plank Page — Polished Timer

#### [MODIFY] [Plank.tsx](file:///c:/Users/I7%207700K/Downloads/188a2d4d-60c8-495b-9dd0-0a8da52c6e43/src/pages/Plank.tsx)
- Enhance circular timer with gradient stroke and glow effect
- Add pulsing ambient ring animation when timer is active
- Personal record display with `NumberTicker`
- Add a "Preparing" screen before timer starts showing posture tips
- Control buttons with glassmorphic styling

---

### Exercises Page — API Integration + Glass UI

#### [MODIFY] [Exercises.tsx](file:///c:/Users/I7%207700K/Downloads/188a2d4d-60c8-495b-9dd0-0a8da52c6e43/src/pages/Exercises.tsx)
- Integrate with ExerciseDB API (fetch & cache in localStorage)
- Exercise cards with GlassIcons-inspired design
- Safety category badges (🟢🟡🔴) with glassmorphic pills
- Exercise detail modal with instructions, tips, video thumbnail
- Skeleton loading states

#### [NEW] [exerciseApi.ts](file:///c:/Users/I7%207700K/Downloads/188a2d4d-60c8-495b-9dd0-0a8da52c6e43/src/utils/exerciseApi.ts)
- `fetchAndCacheExercises()` — fetch from ExerciseDB API, cache in localStorage
- `getExercisesByBodyPart()` — read from cache
- `getExerciseById()` — read from cache
- `filterBySafetyLevel()` — classify exercises into 🟢🟡🔴 categories
- Cache TTL: 7 days
- Fallback to static exercise list if API unreachable

---

### Onboarding — Visual Polish

#### [MODIFY] [Onboarding.tsx](file:///c:/Users/I7%207700K/Downloads/188a2d4d-60c8-495b-9dd0-0a8da52c6e43/src/pages/Onboarding.tsx)
- Add gradient background orbs
- Pain level slider with gradient color (green → amber → red)
- Objective cards with GlassIcons styling
- Smoother step transitions

---

### Types & Storage Updates

#### [MODIFY] [types.ts](file:///c:/Users/I7%207700K/Downloads/188a2d4d-60c8-495b-9dd0-0a8da52c6e43/src/types.ts)
- Add `ExerciseDBExercise` interface matching API response
- Add `ExerciseDBCache` interface
- Update `ExerciseSession` to support API exercise IDs (string instead of enum)
- Add `SafetyLevel` type

#### [MODIFY] [storage.ts](file:///c:/Users/I7%207700K/Downloads/188a2d4d-60c8-495b-9dd0-0a8da52c6e43/src/utils/storage.ts)
- Add cache management functions for ExerciseDB data
- Add monthly volume calculation
- Add radar chart data aggregation helper

---

### Global Styles

#### [MODIFY] [index.css](file:///c:/Users/I7%207700K/Downloads/188a2d4d-60c8-495b-9dd0-0a8da52c6e43/src/index.css)
- Add glassmorphism utility classes
- Add ambient glow animations
- Add gradient text utilities
- Add custom scrollbar styling
- Import the Dock and GlassIcons CSS

#### [MODIFY] [tailwind.config.js](file:///c:/Users/I7%207700K/Downloads/188a2d4d-60c8-495b-9dd0-0a8da52c6e43/tailwind.config.js)
- Add glassmorphism backdrop-blur values
- Add glow box-shadow utilities
- Add new animation keyframes (float, glow-pulse)

---

### SEO & HTML

#### [MODIFY] [index.html](file:///c:/Users/I7%207700K/Downloads/188a2d4d-60c8-495b-9dd0-0a8da52c6e43/index.html)
- Add meta description, Open Graph tags
- Update title to "CoreTracker — Fortalecimento de Core Adaptativo"

---

## Verification Plan

### Automated Tests
- Run `npm run build` to verify TypeScript compilation and no build errors
- Run `npm run dev` and use browser tool to verify:
  - Onboarding flow works end-to-end
  - Dock navigation animates correctly with magnification
  - NumberTicker animates on Home and Progress pages
  - GlassIcons render with 3D tilt effect on Home
  - Plank timer works with enhanced visuals
  - Exercise cards render (with API fallback to static data)
  - Progress charts and heatmap display correctly

### Manual Verification
- Visual inspection via browser recording of all pages
- Verify mobile-first layout (430px max-width) looks premium
