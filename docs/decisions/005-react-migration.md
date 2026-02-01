# ADR 005: Migrate UI to React + TypeScript

## Status

Accepted

## Context

FeedZero's UI was built with vanilla JS Web Components using Shadow DOM for encapsulation and a custom event bus for communication. This approach was chosen to minimize dependencies, but it introduced friction:

1. **Shadow DOM blocked Tailwind utilities** — CSS custom properties crossed the boundary, but utility classes could not be applied inside components
2. **Event bus coupling** — Components communicated through string-based events, making data flow hard to trace and refactor
3. **No type safety** — All modules were plain JS with no compile-time checks
4. **No code sharing** — The architecture was browser-specific with no path to native platforms

The goal of sharing core business logic across web and native UIs (React Native, Tauri) made a framework migration worthwhile.

## Decision

Migrate the UI layer to **React + TypeScript + Zustand + React Router + Tailwind CSS v4**.

### Key choices:

- **React** — Standard component model, massive ecosystem, path to React Native
- **TypeScript (strict mode)** — Compile-time safety for all modules
- **Zustand** — Minimal state management (1.2kB). Store actions call core modules directly, replacing the event bus. Works outside React for testing.
- **React Router** — URL-based navigation. Mobile-first: single panel on small screens, 3-panel grid on desktop. Same routes serve both layouts.
- **Big bang migration** — All UI changes landed together. Core modules (`src/core/`) were only retyped, not restructured.

### Architecture boundary preserved:

Core modules (`src/core/`, `src/utils/`) have **zero React imports**. They are framework-agnostic TypeScript that can be imported by any UI layer. Zustand stores are the bridge — they call core module functions and expose reactive state to React components.

## Consequences

### Positive

- Tailwind utility classes work everywhere (no Shadow DOM)
- Type errors caught at compile time across the entire codebase
- Data flow is explicit: URL → route params → store actions → core modules → store state → component re-render
- Core modules are portable to React Native, Tauri, or any TypeScript runtime
- Store logic is testable without React (plain function calls)

### Negative

- Runtime dependency count increased (React, React DOM, Zustand, React Router)
- Bundle size increased (though tree-shaking mitigates this)
- Existing E2E tests need updating for the new DOM structure

### Neutral

- Test count shifted: 32 Web Component tests deleted, 44 new tests added (27 store + 17 component)
- Event bus retained in codebase for now (used by integration tests) — will be removed in a future cleanup
