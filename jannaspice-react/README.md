# JannaSpice Cuisine — Web App
React + Vite frontend for the JannaSpice Cuisine booking and catering management system.

## Quick Start
Install dependencies:

```bash
npm install
```

Run the local dev server:

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

### Build Commands
- `npm run build` — Bundles the app into `/dist` for production.
- `npm run preview` — Locally preview the production build.

## Demo Account
Use these credentials to test the client dashboard flow:
- **Email:** `client@demo.com`
- **Password:** `pass`

*(Note: Data is held in-memory via React Context. Page refreshes will reset state back to defaults).*

## Project Structure
```plaintext
src/
├── main.jsx              # Application root
├── App.jsx               # View router & global modal mounts
├── index.css             # Tailwind layers and custom styling
├── context/
│   └── AppContext.jsx    # Global application state & handlers
├── data/
│   └── data.js           # Static package details, menus, and defaults
├── utils/
│   └── printReceipt.js   # Printable receipt generator
└── components/
    ├── Home.jsx          # Landing page & quick availability check
    ├── BookingWizard.jsx # Multi-step booking form
    ├── ClientDashboard.jsx # Client-side reservation tracking & chat
    ├── ManagerDashboard.jsx # Admin KPIs, approvals, and calendars
    ├── manager/          # Sub-views (Calendar, Operations pipeline)
    └── modals/           # Alert, Auth, Detail, and Chat overlays
```

## Notes
- **Styles:** Uses Tailwind CSS (`tailwind.config.js`) with custom `spice` and `sand` color palettes.
- **Assets:** Google Fonts and Font Awesome icons are linked directly in `index.html`.