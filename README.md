# FleetPulse Battery Monitoring Dashboard

FleetPulse is a React + Vercel serverless battery intelligence dashboard for tracking fleet health, charge behavior, diagnostics alerts, and long-term reliability trends.

Production URL: https://fleetpulse-battery-dashboard.vercel.app

## Highlights

- Real-time monitoring dashboard with KPI cards and searchable fleet table
- Battery detail diagnostics page with:
	- charge dynamics
	- health index and signal confidence
	- issue pattern analytics
	- year-over-year health trend visualization
- Resilient data layer:
	- serverless API (`/api/batteries`)
	- local JSON fallback (`public/batteryAPI.json`)
	- client-side caching for fast navigation
- Deployment-ready Vercel configuration for SPA routing and API runtime

## Live Routes

- Dashboard: `/`
- Battery detail: `/battery/:id`
- Chart showcase with ID picker: `/showcase`

## Tech Stack

- Frontend: React 18, React Router, Chart.js, React Testing Library
- API: Vercel serverless function (Node.js runtime)
- HTTP/Data: Axios
- Hosting: Vercel

## Project Structure

```text
.
|-- api/
|   `-- batteries.js
|-- public/
|   `-- batteryAPI.json
|-- src/
|   |-- Components/
|   |   |-- BatteryDetail.js
|   |   |-- Graph.js
|   |   |-- Table.js
|   |   |-- api.js
|   |   `-- helpers.js
|   |-- App.js
|   `-- App.test.js
|-- vercel.json
`-- README.md
```

## API Contract

### `GET /api/batteries`

Returns all fleet batteries.

### `GET /api/batteries?id=<battery-id>`

Returns one battery by ID with enriched response fields (issue labels and measurements).

## Local Development

### Prerequisites

- Node.js 18+
- npm 9+

### Install and Run

```bash
npm install
npm start
```

App URL: `http://localhost:3000`

## Scripts

| Script | Purpose |
|---|---|
| `npm start` | Run the development server |
| `npm run build` | Create production build artifacts |
| `npm test -- --watchAll=false` | Run tests once in CI-style mode |

## Unit Testing

### Run all tests

```bash
npm test -- --watchAll=false
```

### Current coverage focus

- App navigation and route flow
- Battery detail diagnostics rendering and error states
- Helper utilities (`filterRows`, `sortRows`, `paginateRows`, type conversion)

## Production Build

```bash
npm run build
```

## Deploy to Vercel

### Option 1: Vercel Dashboard (recommended)

1. Push this repository to GitHub.
2. Go to Vercel and import the repository.
3. Build settings:
	 - Framework: Create React App
	 - Build command: `npm run build`
	 - Output directory: `build`
4. Deploy.

### Option 2: Vercel CLI

```bash
npm i -g vercel
vercel
vercel --prod
```

## Troubleshooting

- If frontend does not open, ensure port `3000` is free.
- If tests fail with canvas errors, confirm chart components are mocked in tests.
- If Vercel deploy fails, verify account login and project linkage in CLI.

## License

MIT License
