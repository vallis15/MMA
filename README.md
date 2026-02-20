# MMA Manager - Fight Management System

A professional dark-mode web application for managing MMA fighters, training programs, and fight scheduling. Built with React, TypeScript, Tailwind CSS, Framer Motion, and Lucide Icons.

## Features

- **Dashboard**: Overview of fighters, fights, and statistics
- **Gym**: Manage fighter training programs and conditioning
- **Arena**: Create and manage fights between fighters
- **Rankings**: View fighter leaderboards and statistics
- **Dark Mode UI**: Professional charcoal/black theme with neon green and alert red accents
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Smooth Animations**: Powered by Framer Motion

## Tech Stack

- **Frontend**: React 18.3.1 + TypeScript
- **Build Tool**: Vite 5.4.0
- **Styling**: Tailwind CSS 3.4.1
- **Icons**: Lucide React 0.462.0
- **Animations**: Framer Motion 11.0.8
- **Linting**: ESLint + TypeScript ESLint

## Quick Start

### Windows Users
Double-click `start_project.bat` to automatically:
- Install dependencies (if needed)
- Start the development server
- Open the browser at http://localhost:5173

### macOS/Linux Users
Run the startup script:
```bash
chmod +x start_project.sh
./start_project.sh
```

Or manually:
```bash
npm install
npm run dev
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
MMA/
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── Layout.tsx
│   │   ├── Sidebar.tsx
│   │   └── index.ts
│   ├── pages/             # Page components
│   │   ├── Dashboard.tsx
│   │   ├── Gym.tsx
│   │   ├── Arena.tsx
│   │   ├── Rankings.tsx
│   │   └── index.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── public/                # Static assets
├── index.html             # HTML entry point
├── package.json
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
├── vite.config.ts
├── start_project.bat      # Windows starter script
├── start_project.sh       # macOS/Linux starter script
└── README.md

```

## Color Palette

- **Background**: Dark charcoal/black (#0a0a0a, #1a1a1a, #2a2a2a)
- **Primary Accent**: Neon Green (#00ff41)
- **Secondary Accent**: Alert Red (#ff3333)
- **Text**: White and grayscale

## UI Components

### Sidebar
- Navigation with Home, Gym (Training), Arena (Fights), Rankings (Leaderboards)
- Active state highlighting with neon green
- Mobile-responsive toggle
- Brand header with MMA Manager logo

### Layout
- Two-column layout with fixed sidebar and scrollable main content
- Responsive design for all screen sizes
- Smooth animations and transitions

## Next Steps

The Fighter Logic module will be added next to handle:
- Fighter creation and management
- Fighter stats and attributes
- Training program management
- Fight scheduling and results

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Development

1. Make sure Node.js 16+ is installed
2. Run `npm install` to install dependencies
3. Run `npm run dev` to start the development server
4. Open http://localhost:5173 in your browser

## License

MIT
