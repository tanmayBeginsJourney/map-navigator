# Campus Indoor−Outdoor Navigation System — Product Requirements Document (PRD)

---

## 0. User Context Dump

I am a college student, first year, studying computer science. People get lost on my campus sometimes, so me and my club mates want to make a **web‑based navigation system** that lets users input their initial location (or obtain it through QR) and their final destination, then receive step‑by‑step textual/visual guidance. The reason this is more difficult than simply using Google Maps is that we need the map to work **inside buildings with multiple floors** as well.

---

### Initial Brain‑stormed Problems

1. **GPS accuracy** — Is GPS (as used in Google Maps) accurate to the nearest metre? If not, then live tracking is not an option. It would be better to stick with manual entry. For example: the user enters that they want to go to _x_ location; we show them the path to _y_ location and instruct them to take a lift to _z_ floor. Once they get to the lift, we can ask if they successfully reached _z_ floor through the lift. When they click **yes**, the map changes to that particular floor.

2. **Indoor map design & path‑finding** — Since this map must work on floors of individual buildings:

   - Will we have to design separate floors of separate buildings manually to create the assets?
   - How will path‑finding and path highlighting work?
   - Will the UI look similar to Google Maps (i.e., a blue line on a 2‑D map)?
   - A 2‑D map designed to work in 3‑D (because of multiple floors) sounds confusing. How do we begin?
   - Should the navigation system be like an RPG game where there is a bigger map of the entire campus (2‑D view) and, once you enter a building, it shifts to the ground‑floor map of that building and changes every time you take a lift?

---

### Sample User Situation

“My name is John. I am currently in **room 1101** on the **1st floor** of **building 1**. I want to go to **room 2201** on the **2nd floor** of **building 2**, but I’m new, so I don’t know how to go there. What should I do?”

---

### Visualised Walk‑through (Current Idea)

- John finds the nearest **QR code** (most likely right next to the lift) and scans it.  
- The **initial location** is automatically input as _1st floor, building 1_ and a map of that floor (rooms labelled) is displayed.  
- He enters his destination as **room 2201**.  
- He is told to **take the lift to the ground floor**.  
- Once he does that, he can click **“yes”** on the pop‑up prompt _“Did you take the lift to the ground floor?”_.  
- The map shifts to the **ground‑floor view** of building 1 and guides him to the correct exit (if multiple exits exist).  
- After confirming exit, the map shifts to the **overall campus map** (because he has exited the building) and guides him to **building 2**.  
- Another prompt confirms whether he is inside building 2.  
- The map then displays the **ground‑floor view** of building 2, guiding him to the lift and prompting him to **take the lift to the 2nd floor**.  
- Finally, the **2nd‑floor map** of building 2 appears, guiding him to the correct room.  
- I visualise this guiding mechanism as a simple blue line similar to Google Maps, but it can be changed.

---

### Ideal System Description

The ideal map‑navigation system would work perfectly for **any initial location** (pre‑set through QR codes) and **any final destination** (another QR code, a room number, or another unique identifier).

3. **Interaction & Utility Questions** — How will this map handle user interaction (zooming, places‑of‑interest descriptions, etc.)? Basically, how can we increase the utility of the map?

---

## 1. Version History

| Date        | Author          | Version | Notes                                              |
| ----------- | --------------- | ------- | -------------------------------------------------- |
| 12‑Jun‑2025 | Campus‑Nav team | 0.1     | Initial full draft based on stakeholder discussion |

---

## 2. Vision & Goals

> **Vision:** “Never get lost again at . Scan, choose, arrive.”\
> **Goal for MVP:** Allow any visitor to navigate from one room QR anchor to any other room on campus via step‑by‑step indoor + outdoor directions, **optimised for hand‑held mobile browsers on both iOS & Android**, with no native app or extra hardware. The experience must remain fully usable on larger screens, but design decisions favour one‑hand operation on devices ranging from 360 × 640 px up to tablet form‑factors.

### Success Metrics (MVP)

1. **Navigation success rate** ≥ 95 % (user reports they reached the destination without external help).
2. **Median path‑planning time** < 150 ms on a mid‑range phone.
3. **Median initial load time** < 1 s over 4 G.
4. **80 % positive rating** in post‑navigation micro‑survey.

---

## 3. Target Users / Personas

- **Freshers** (Year‑1 students) unfamiliar with building codes.
- **Visiting parents & guests** during fests and convocations.
- **New faculty / admin staff** during onboarding.

Accessibility note: lifts exist in almost every building and will be used as default vertical links. Wheel‑chair routing is _future scope_.

---

## 4. Assumptions & Constraints

| ID  | Assumption / Constraint                                                        | Notes |
| --- | ------------------------------------------------------------------------------ | ----- |
| A1  | QR codes may be pasted freely at agreed anchor points.                         |       |
| A2  | Floorplans are publicly shareable; no security concern.                        |       |
| A3  | Continuous indoor positioning _not_ required (no beacons, no Wi‑Fi RTT).       |       |
| A4  | Users have high‑speed cellular data; still optimise bundles.                   |       |
| A5  | Placeholder SVGs acceptable until real PDFs arrive (campus closed for summer). |       |

---

## 5. Scope — MVP vs Future

### **In‑Scope (MVP)**

- **Mobile‑first, responsive** web app served from a single URL; layouts validated on common viewports (iPhone SE, iPhone 14 Pro Max, Pixel 6, iPad mini, 1366 × 768).
- Single campus database (multi‑campus later).
- Indoor routing via lifts by default; ignore stair‑only shortcuts.
- QR scan ➜ anchor node; text search / QR for destination.
- Step‑through floor changes via “I’m here” confirmation.
- Outdoor routing across building footprints.
- English UI; hard‑coded POI labels.

### **Out‑of‑Scope (Post‑MVP)**

- Live blue‑dot positioning.
- Offline PWA packaging.
- Wheelchair / step‑free optimisation toggle.
- Multi‑language localisation.
- Admin map‑editing GUI.

---

## 6. Detailed User Stories

| ID    | Priority | Story                                                                                                                                                       | Acceptance Criteria                                                                         |
| ----- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| US‑01 | Must     | _As a visitor_, after scanning a QR at my current room, I can input a room number and see a highlighted path segment on my current floor within 2 s.        | QR resolved to node; path API responds ≤ 150 ms; blue line drawn; legend shows next action. |
| US‑02 | Must     | _As a visitor_, when I reach a lift, I tap “I’m inside lift, go to G” and the map auto‑switches to the ground‑floor layer with the new segment highlighted. | Touch event triggers floor change; correct sub‑path displayed.                              |
| US‑03 | Must     | _As a content maintainer_, I can replace placeholder SVGs with real floor SVGs without touching JS code.                                                    | Build pipeline reads `/assets/svg/<bldg>/<floor>.svg`; graph rebuild script available.      |
| US‑04 | Should   | _As any user_, if network drops mid‑route, the last retrieved tiles & path still render.                                                                    | Service‑worker caches last 3 floors & outdoor layer; path cache in localStorage.            |
| US‑05 | Could    | _As a newcomer_, I can search “Mess Hall” instead of room #.                                                                                                | POI index with fuzzy search ≤ 50 ms.                                                        |

---

## 7. Functional Requirements

| Ref  | Requirement                                                                                                    |
| ---- | -------------------------------------------------------------------------------------------------------------- |
| FR‑1 | The system shall render a 2‑D vector map for the current layer, zoomable/pannable.                             |
| FR‑2 | The system shall accept a start node ID (QR) and end node ID (QR or search).                                   |
| FR‑3 | The routing engine shall compute the shortest path across indoor & outdoor graphs using A\* in ≤ 150 ms.       |
| FR‑4 | The UI shall divide the full path into _segments_ by floor/exterior and expose a **Next →** action to advance. |
| FR‑5 | The system shall log `route_start`, `segment_complete`, `route_complete` events with anonymised IDs.           |

---

## 8. Non‑Functional Requirements

- **Performance:** see success metrics.
- **Cross‑browser:** Latest Chrome & Firefox on Android 13+, Safari on iOS 15+, plus desktop Chrome ≥ v100. Must gracefully adapt across 360 × 640 to 1024 × 1366 viewports.
- **Security:** No PII stored; QR encodes only opaque node IDs.
- **Reliability:** SLA 99.5 % uptime for routing API (school hours).
- **Maintainability:** New floors importable via CLI; graphs stored in PostGIS & exportable to JSON for bundle.

---

## 9. System Architecture

```
┌──────────────┐          HTTPS           ┌──────────────┐
│  Mobile Web  │  ────────────────▶      │  Routing API │
│  (React +    │◀───────────────┐        │  (Node/Exp.) │
│ Mapbox‑GL JS)│                │  REST  │  + PostGIS   │
└──────────────┘                └────────┴──────────────┘
    ▲   ▲                              ▲
    │   │ WebSocket (future)           │
    │   └── QR Scan (jsQR)             │
    ▼                                  ▼
Service Worker                   Graph JSON / SQL
(Cache tiles & last path)        (nodes, edges, POIs)
```

### **Chosen Stack (optimal for team skillset)**

- **Front‑end:** React 18 + Vite, Mapbox GL JS ^3.x, Zustand for state.
- **Back‑end:** Node 20, Express 5, Typescript, `pg` driver.
- **DB:** PostgreSQL 15 + PostGIS 3.4.
- **DevOps:** Docker Compose (db + api); Netlify/Vercel for static SPA.

---

## 10. Data Model

### Node table

| column  | type  | description                     |
| ------- | ----- | ------------------------------- |
| id (PK) | text  | `b1‑1101`                       |
| label   | text  | “Room 1101”                     |
| bldg    | text  | Building code                   |
| floor   | int   | 0‑N; −1 for outdoor campus      |
| x,y     | float | metres in local floor CRS       |
| kind    | enum  | room, corridor, lift, exit, poi |

### Edge table

| from | to  | distance_m | weight | kind                      |
| ---- | --- | ---------- | ------ | ------------------------- |
| FK   | FK  | float      | float  | corridor / lift / outdoor |

---

## 11. UX Guidelines

- **Mobile‑first layout:** all primary controls reachable within thumb zone (<650 px height safe‑area).
- **Color:** path = brand blue `#2979FF`, lifts = purple, exits = green.
- **Floor selector:** pill control top‑right, auto‑jump when segment changes.
- **CTA button:** sticky bottom “Next step →”.
- **QR scanner overlay:** semi‑transparent mask with square guide; auto‑rotates camera feed.
- **Responsive typography:** clamp between 14 px and 18 px body text using `clamp()` CSS.
- **Accessibility contrast:** WCAG AA colors.

---

## 12. API Specs (v1)

### `POST /route`

```jsonc
{
  "source": "b1‑1101",
  "target": "b2‑2201",
  "constraints": {
    "liftsOnly": true,
  },
}
```

#### Response

```jsonc
{
  "segments": [
    { "floor": 1, "polyline": [[24.6,13.2],[...]] },
    { "floor": 0, "polyline": [[...]] },
    { "floor": "campus", "polyline": [[...]] },
    { "floor": 0, "bldg": "B2", "polyline": [[...]] },
    { "floor": 2, "polyline": [[...]] }
  ],
  "instructions": [
    "Leave room 1101 and turn left",
    "Take lift A to Ground",
    "Exit Building 1 via south door",
    ...
  ],
  "distance_m": 415,
  "eta_min": 6
}
```

---

## 13. Roadmap / Milestones

| Month | Deliverable                                                     | Owner        |
| ----- | --------------------------------------------------------------- | ------------ |
| 0     | Repo bootstrap, placeholder SVG imported, hard‑coded route demo | FE lead      |
| 1     | Routing API w/ JSON graph, React floor‑switcher                 | BE lead      |
| 2     | Pilot building fully mapped, QR kit printed, end‑to‑end test    | Mapping lead |
| 3     | Inter‑building outdoor routing, analytics plugged               | All          |
| 4     | Beta test w/ freshmen volunteers, metrics review                | PM           |
| 5     | Polish & public launch day                                      | Entire club  |

---

## 14. Risks & Mitigations

| Risk                                 | Likelihood | Impact | Mitigation                                      |
| ------------------------------------ | ---------- | ------ | ----------------------------------------------- |
| Real floorplans very different scale | M          | M      | Store coordinates in metres; run scaling script |
| Data entry fatigue                   | H          | H      | Build quick CSV→graph converter; crowdsource    |
| Mobile camera QR failures            | L          | M      | Provide manual “Choose current room” fallback   |

---

## 15. Future Enhancements

- Live positioning via Bluetooth LE beacons.
- Wheelchair / stairs‑avoid mode.
- Multi‑language support.
- PWA offline bundle.
- Admin GUI for drag‑and‑drop editing.

---

## 16. Glossary

- **Anchor QR** – Printed code encoding node ID for current location.
- **Segment** – Continuous part of a path that lies on one floor/exterior.
- **Node** – Graph vertex representing a room, door, lift landing, etc.

---

---

## 17. Repository & Version‑Control Guidelines

### 17.1 Repository

- **Primary repo:** [https://github.com/tanmayBeginsJourney/map-navigator](https://github.com/tanmayBeginsJourney/map-navigator)
- **Branch model:** `main` (always deployable) plus short‑lived feature branches prefixed by `feat/`, `fix/`, or `chore/`.

### 17.2 Commit Message Convention (Conventional Commits)

```text
feat(map): draw placeholder building footprints
fix(api): handle missing node ids gracefully
docs(prd): add repo & VC section
```

- Use **imperative present tense** (“add”, “fix”, “remove”).
- Include a **scope** in parentheses when relevant.
- Limit body lines to ≤ 72 chars; add a footer line beginning `BREAKING CHANGE:` if behaviour changes incompatibly.

### 17.3 Git Workflow

1. Create/claim an **issue** → new branch `feat/123‑short‑slug`.
2. Commit early & often following Conventional Commits.
3. Push and open a **pull request** (PR) against `main`.
4. Require ≥ 1 peer review **and** passing CI before merge.
5. **Squash‑merge**; resultant commit message should still follow Conventional Commits.

### 17.4 Tagging & Releases

- Use SemVer: `v0.1.0‑alpha1 … v0.1.0` during MVP.
- Tag `v1.0.0` when the system is production‑ready (public launch).

### 17.5 CI/CD

- **GitHub Actions** workflow `ci.yml` runs lint, unit tests, TypeScript check.
- Successful push to `main` auto‑deploys preview to Vercel; tagged releases promote to **production**.

---

## 18. Developer Testing & Real‑Time Preview

| Tool / Command                   | Purpose                                                                                           |
| -------------------------------- | ------------------------------------------------------------------------------------------------- |
| `npm run dev` (Vite)             | Starts local server with **hot‑module reload** at [http://localhost:5173](http://localhost:5173). |
| `npm run dev -- --host`          | Exposes LAN IP; scan the QR printed in the terminal on a phone to preview in real time.           |
| `npm run preview`                | Serve production build locally for perf audits (Lighthouse).                                      |
| Vite plugin `vite-plugin-qrcode` | Automatically prints a QR of the dev‑server URL on each restart.                                  |
| `adb reverse tcp:5173 tcp:5173`  | Android USB debugging no‑Wi‑Fi preview.                                                           |
| Safari Web Inspector (iOS)       | Remote debug iPhone layout issues.                                                                |

**Testing matrix:**

- iOS 15 Safari phone (portrait + landscape)
- Android 13 Chrome phone (light + dark)
- iPadOS split‑screen
- Desktop Chrome 1366 × 768

---

## 19. Engineering Standards & Quality Gates

### 19.1 Testing Strategy

| Layer       | Toolset                                       | Key Metric                                                    |
| ----------- | --------------------------------------------- | ------------------------------------------------------------- |
| Unit        | **Vitest** (Node) or **Jest**                 | ≥ 90 % line‑coverage on utils & A\* algorithm                 |
| Component   | **React Testing Library**                     | Render MapCanvas/FloorSelector without runtime errors         |
| Integration | Supertest against Express API                 | `/route` responds ≤ 150 ms with valid JSON                    |
| End‑to‑End  | **Cypress** headless Chrome in GitHub Actions | User flows (scan‑QR → arrive) pass on Android & iOS viewports |
| Performance | **Lighthouse CI** budget                      | FCP < 2.5 s, TTI < 4 s on Moto G4 emulation                   |

### 19.2 Coding Standards & CI Gates

- **ESLint** (`eslint-config-airbnb` + TypeScript), **Prettier**, and **EditorConfig** enforced in repo.
- **Husky** pre‑commit hook runs `lint-staged` → rejects commits with lint or type errors.
- `ci.yml` workflow matrix (`node@20`, `node@18`) must pass **lint → test → build**.
- Any PR failing checks is blocked from merge.

### 19.3 Asset Pipeline

1. `scripts/pdf2svg.sh` — batch converts official floorplan PDFs using `inkscape --export-type=svg`.
2. `node scripts/graph-build.mjs` — parses SVGs, snaps doors/corridors, exports `graph.json` & PostGIS SQL.
3. Running the pipeline is **idempotent**; old placeholder assets are overwritten.
4. Artefacts committed in `assets/svg/` and `graph/` to keep deployments deterministic.

### 19.4 Environment Variables & Deployment

| Variable       | Description                                        |
| -------------- | -------------------------------------------------- |
| `MAPBOX_TOKEN` | Public Mapbox style token (scope: styles\:read)    |
| `DATABASE_URL` | Postgres connection string for routing API         |
| `VERCEL_ENV`   | `preview` / `production` flag used by build script |

- `.env.template` stored at repo root; never commit real secrets.
- **GitHub Actions** `deploy.yml` builds SPA, pushes preview to Vercel for every PR; tag `v*` promotes to production.

### 19.5 AI‑Augmented Developer Workflow

1. **Cursor Taskmaster** ingests this PRD → auto‑creates GitHub issues & feature branches (complexity ≤ 5 each).
2. Developer runs `Cursor Run` to generate boilerplate code on branch.
3. Open Pull Request; **CodeRabbit AI** posts review comments.
4. Address actionable feedback; re‑run tests → merge via squash.
5. Conventional Commit message auto‑generated from PR title.

> _Note: Workflow specifics are documented in **`/docs/development-workflow.md`**; this section sets the quality bar._

---

**End of PRD v0.1**
