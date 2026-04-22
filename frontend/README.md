# OpenEx Frontend

Frontend client for the OpenEx simulated crypto exchange.

For full project architecture, sprint plan, observability strategy, and backend scope, see the repository README at the project root.

## Prerequisites

- Node.js 18+
- npm 9+

## Run Locally

```bash
npm install
npm run dev
```

Default local URL:

- http://localhost:3000

## Scripts

- `npm run dev` - start dev server
- `npm run build` - create production build
- `npm run preview` - preview production build
- `npm run lint` - run TypeScript checks
- `npm run clean` - remove dist output

## Frontend Design Notes

### Visual Direction

- Theme: high-contrast exchange terminal aesthetic
- Core colors: dark graphite surfaces with yellow accent and red/green market signals
- Typography: Space Grotesk for UI, JetBrains Mono for numeric market data

### Design Tokens

Global UI tokens are defined in [src/index.css](src/index.css):

- Background and panel colors
- Border and muted text colors
- Accent and focus ring colors
- Shared utilities (`surface-panel`, `skeleton-line`, scrollbar helpers)

### Interaction States

- Buttons and navigation include hover/active/focus-visible states
- Data regions include standardized loading skeletons
- Empty and error states use shared UI feedback components

### Responsive Behavior

- Mobile navigation: drawer menu + fixed bottom tab bar
- Main pages are optimized for small viewports and large desktop layouts
- Trading layout stacks on mobile and preserves split panels on desktop

### Accessibility

- Visible keyboard focus ring via global `:focus-visible`
- ARIA labels for key controls in trading interactions
- Better state messaging for loading/error conditions in data-heavy views
