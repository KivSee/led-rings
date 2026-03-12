# Timeline UI

A beautiful vertical timeline interface for managing timeframes. Users can add, edit, and delete timeframes with custom labels, start/end beats, and colors.

## Features

- ✨ Vertical timeline visualization
- ➕ Add new timeframes
- ✏️ Edit timeframe labels and times by clicking on them
- 🗑️ Delete timeframes
- 🎨 Automatic color assignment for new timeframes
- 📱 Responsive design

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Navigate to the UI directory:
   ```bash
   cd ui
   ```

2. Install dependencies:
   ```bash
   npm install
   ```
   or
   ```bash
   yarn install
   ```

### Running the Application

Start the development server:

```bash
npm run dev
```

or

```bash
yarn dev
```

The application will be available at `http://localhost:5173` (or another port if 5173 is occupied).

**Send Sequence & Live mode:** To use "Send Sequence" and "Live mode" (Run/Stop controlling the device):

1. Run the control server from the repo root: `yarn control-server` or `npm run control-server` (default port 3080).
2. The UI reads the control server URL from the `ui/.env` file. Edit this file and set `VITE_API_URL` to the URL where the control server is running (e.g. `http://localhost:3080`). Change it as needed when the server runs on a different host or port.
3. With Live mode checked, Run also starts the song on the device at the current marker time; Stop sends stop.

### Building for Production

To create a production build:

```bash
npm run build
```

or

```bash
yarn build
```

The built files will be in the `dist` directory.

### Preview Production Build

To preview the production build locally:

```bash
npm run preview
```

or

```bash
yarn preview
```

## Usage

1. **Add a Timeframe**: Click the "+ Add Timeframe" button at the top
2. **Edit Label**: Click on a timeframe's label to edit it
3. **Edit Beats**: Click on the start or end beat value to edit it
4. **Delete Timeframe**: Click the "×" button on a timeframe

The timeline axis displays beats (marked with "b"), allowing you to manage musical or rhythmic timeframes.

## Technology Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **CSS3** - Styling with modern gradients and animations
