@AGENTS.md

# SmartCampus app context

## Project shape

- This directory is the Expo SDK 57 / React Native application. The separate Node API lives at `../api`.
- Navigation is file-based with Expo Router. Root screens are in `app/`; the five visible tabs are configured in `app/(tabs)/_layout.tsx`.
- App-wide shared data and styles live in `data/`, `constants/`, `hooks/`, and `components/`. TypeScript path alias `@/` points to this directory.
- Keep user-facing copy in Vietnamese and follow the existing React Native and Expo patterns.

## Map architecture

- `app/(tabs)/map.tsx` owns map-screen state, search, location permission handling, selected place, route preview, and the GPX demo.
- `components/campus-map.tsx` is the native map implementation using `react-native-maps`. `components/campus-map.web.tsx` is the web implementation using Leaflet; `components/campus-map.types.ts` defines their shared props. Keep behavior and props consistent across platforms, while respecting platform-specific capabilities.
- `data/campusMap.ts` owns campus/place coordinates. `data/campusRouting.ts` owns the approximate campus boundary, walkway graph, and local Dijkstra route calculation. `data/gpxNavigation.ts` contains the simplified KTX Lào → Nhà số 7 GPX path and its recorded metadata.
- Many building coordinates, the campus boundary, and the local walkway graph are estimates from a diagram, not surveyed navigation data. Do not present these as verified paths or connect a live GPS point to a destination with a guessed straight line.
- The GPX playback is a demo, not live navigation: it advances along the recorded track and does not provide turn-by-turn or voice guidance.
- The backend routing API is documented in `docs/routing-api.md`; the current map UI uses local data and does not sync with that API.

## Change and validation guidance

- Before changing Expo code or config, follow `AGENTS.md` and consult the exact Expo SDK 57 documentation.
- Keep `package.json` and `package-lock.json` aligned. Use `npx expo install --fix` when SDK-compatible Expo package versions need syncing; do not use `--force` or `--legacy-peer-deps` to hide compatibility problems.
- From this directory, run the smallest relevant checks. Main checks are `npm run typecheck`, `npm run lint`, `npm run test:routes`, `npm run test:api`, and `npm run export:web`.
- Map implementation details and data caveats are documented in `docs/campus-map.md`; update it when map behavior or supported workflows change.
