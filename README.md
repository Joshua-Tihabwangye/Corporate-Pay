# CorporatePay Console (Vite + React + TypeScript + MUI + Tailwind)

## Quick start
```bash
npm install
npm run dev
```

## Routes
- `/` Landing page (CorporatePay marketing)
- `/console` CorporatePay Admin Console (AppShell)
- `/auth/login` Login + Org Selector
- `/auth/mfa` MFA & Device Trust
- `/auth/invite` Invite Acceptance & EVzone Account Linking

> Tip: In the console, navigation is internal to the AppShell (stateful). Direct page routes also exist for QA.

## Notes
- MUI is configured with EVzone brand colors and `StyledEngineProvider` so Tailwind utilities can coexist.
- All generated pages are in `src/pages/generated/` and are imported into the AppShell registry.
- This is a front-end shell (no backend wired yet). Hook API calls in `src/services/` when ready.
