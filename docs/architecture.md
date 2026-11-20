# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

- Presentation tier decision: Keep page components responsible for rendering and user interaction. Use the shared API client with relative `/api` paths, and expose loading, empty, and error states accessibly.
- Logic tier decision: Keep Express route handlers thin and implement feature behavior in `octofitService.ts`. Validate inputs and referenced records before writes, and return deliberate 4xx errors through the existing error middleware.
- Data tier decision: Put required fields, types, defaults, and references in the Mongoose models. Keep seed data representative and idempotent without deleting unrelated existing records.
- Activity tracking approach: Validate `userId`, `teamId`, activity type, and positive minutes; verify both referenced records exist; then persist their IDs, the submitted activity details, computed points, and a creation timestamp. Keep point calculation in the service so it is consistent.
- Team management approach: Require a non-empty name, preserve the submitted name and mascot, and store member references. Default omitted members to an empty array.
- Leaderboard approach: Aggregate activity points by team, sort from highest total to lowest, and return each team's name, total, and 1-based rank.
- Workout suggestions approach: Find the user by email, use the user's fitness goal and recent activity to select a matching workout, and include a reason. Return a deliberate 4xx response when no user matches.

## Test plan

- Data tier: `npm run test:data --prefix octofit-tracker/backend` — run; baseline is 4 failures and 1 pass. Failures indicate missing required-field validation in the User, Team, Activity, and Workout schemas.
- API: `npm run test:api --prefix octofit-tracker/backend` — run; baseline is 4 failures. Invalid activity and team requests return `501` instead of `400`, the leaderboard is empty, and the first workout suggestion does not match the user's activity pattern.
- Presentation: `npm test --prefix octofit-tracker/frontend` — run; baseline is 15 failures. Failures cover expected API-driven content/request behavior and the loading, empty, and accessible error states.
- Backend build: `npm run build --prefix octofit-tracker/backend` — run after the contract tests pass; a failure indicates backend TypeScript/build errors.
- Frontend build: `npm run build --prefix octofit-tracker/frontend` — run after the contract tests pass; a failure indicates frontend production-build errors.
