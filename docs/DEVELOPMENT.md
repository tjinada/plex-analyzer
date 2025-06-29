# Plex Analyzer - Development Documentation

## Project Structure

This project uses a unified package.json structure with both frontend (Angular) and backend (Express) in the same repository.

```
plex-analyzer/
├── package.json              # Unified dependencies and scripts
├── .env                      # Environment configuration
├── .env.example             # Environment template
├── tsconfig.json            # Root TypeScript configuration
├── angular.json             # Angular CLI configuration
├── eslint.config.js         # ESLint configuration
├── Dockerfile               # Production Docker image
├── Dockerfile.dev           # Development Docker image
├── docker-compose.yml       # Docker Compose configuration
├── backend/                 # Express.js backend
│   ├── src/
│   │   ├── app.ts          # Main application entry
│   │   ├── config/         # Configuration management
│   │   ├── controllers/    # Route controllers
│   │   ├── services/       # External API services
│   │   ├── models/         # TypeScript interfaces
│   │   ├── utils/          # Utility functions
│   │   ├── middleware/     # Express middleware
│   │   └── routes/         # API routes
│   ├── dist/               # Compiled backend output
│   └── tsconfig.json       # Backend TypeScript config
├── frontend/               # Angular frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/       # Core services and guards
│   │   │   ├── features/   # Feature modules
│   │   │   ├── shared/     # Shared components
│   │   │   └── models/     # TypeScript interfaces
│   │   └── assets/         # Static assets
│   ├── dist/               # Compiled frontend output
│   └── tsconfig.json       # Frontend TypeScript config
└── docs/                   # Documentation
```

## Available Scripts

### Development
```bash
npm run dev                  # Start both backend and frontend servers
npm run dev:backend         # Start only backend server (port 3000)
npm run dev:frontend        # Start only frontend server (port 4200)
```

### Building
```bash
npm run build               # Build both backend and frontend
npm run build:backend       # Build only backend
npm run build:frontend      # Build only frontend
```

### Testing
```bash
npm run test                # Run all tests
npm run test:backend        # Run backend tests
npm run test:frontend       # Run frontend tests
```

### Code Quality
```bash
npm run lint                # Lint all code
npm run lint:backend        # Lint backend code
npm run lint:frontend       # Lint frontend code
npm run typecheck           # Check TypeScript compilation
npm run typecheck:backend   # Check backend TypeScript
npm run typecheck:frontend  # Check frontend TypeScript
```

### Production
```bash
npm start                   # Start production server
```

## Environment Configuration

The application uses a `.env` file in the root directory for configuration:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Plex Configuration
PLEX_URL=http://localhost:32400
PLEX_TOKEN=your-plex-token-here

# Optional: Other service configurations
TAUTULLI_URL=http://localhost:8181
TAUTULLI_API_KEY=your-tautulli-api-key
RADARR_URL=http://localhost:7878
RADARR_API_KEY=your-radarr-api-key
SONARR_URL=http://localhost:8989
SONARR_API_KEY=your-sonarr-api-key

# API Configuration
CORS_ORIGIN=http://localhost:4200

# Logging
LOG_LEVEL=info
```

## Development Workflow

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Servers**
   ```bash
   npm run dev
   ```
   This starts:
   - Backend on http://localhost:3000
   - Frontend on http://localhost:4200

3. **Code Quality Checks**
   ```bash
   npm run typecheck  # Check for TypeScript errors
   npm run lint       # Check code style
   ```

4. **Build for Production**
   ```bash
   npm run build
   ```

## API Endpoints

### Configuration
- `GET /api/config` - Get current configuration status
- `POST /api/config` - Update configuration
- `POST /api/config/test` - Test service connections
- `DELETE /api/config` - Reset configuration

### Health Check
- `GET /health` - Server health check

### Libraries (Coming Soon)
- `GET /api/libraries` - Get all libraries
- `GET /api/libraries/:id` - Get specific library details

### Statistics (Coming Soon)
- `GET /api/statistics` - Get global statistics
- `GET /api/statistics/:libraryId` - Get library statistics

## Frontend Architecture

### Routing
- `/setup` - Configuration wizard
- `/dashboard` - Main dashboard (requires configuration)
- `/analyzer/:libraryId` - Library analysis view (requires configuration)

### Guards
- `configGuard` - Ensures system is configured before accessing protected routes

### Services
- `ApiService` - HTTP client wrapper
- `ConfigService` - Configuration management

### Features
- **Setup** - Configuration wizard
- **Dashboard** - Overview of all libraries
- **Analyzer** - Detailed library analysis

## Backend Architecture

### Services
- `PlexService` - Plex Media Server API integration
- Future: `TautulliService`, `RadarrService`, `SonarrService`

### Controllers
- `ConfigController` - Configuration management endpoints

### Utilities
- `CacheUtil` - In-memory caching
- `FormatterUtil` - Data formatting functions

### Models
- TypeScript interfaces for type safety
- Standardized API response format

## Docker Support

### Development
```bash
docker-compose --profile dev up
```

### Production
```bash
docker-compose up
```

## Code Style

- **TypeScript** - Strict typing enabled
- **ESLint** - Code style enforcement
- **Angular Style Guide** - Component and service patterns
- **Express.js Best Practices** - RESTful API design

## Testing Strategy

- **Frontend**: Jasmine/Karma for unit tests
- **Backend**: Jest for unit and integration tests
- **E2E**: Cypress (to be implemented)

## Contributing

1. Ensure code passes all checks:
   ```bash
   npm run typecheck
   npm run lint
   npm run test
   ```

2. Follow the established patterns for:
   - Component structure
   - Service patterns
   - API endpoint design
   - Error handling

3. Update documentation for new features