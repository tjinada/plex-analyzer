# Frontend Architecture Documentation

## Overview

The Plex Analyzer frontend is built with Angular 17 using standalone components and follows modern Angular architecture patterns. The application emphasizes KISS (Keep It Simple, Stupid), YAGNI (You Aren't Gonna Need It), and SOLID principles.

## Technology Stack

- **Framework**: Angular 17 with standalone components
- **UI Library**: Angular Material 17
- **Styling**: SCSS with custom theming
- **State Management**: Simple service-based state management
- **HTTP Client**: Angular HttpClient
- **Build Tool**: Angular CLI with Webpack
- **Testing**: Jest + Angular Testing Library

## Project Structure

```
src/
├── app/
│   ├── core/                 # Core application services and guards
│   │   ├── services/         # Core business services
│   │   └── guards/           # Route guards
│   ├── shared/               # Shared components, pipes, and utilities
│   │   ├── components/       # Reusable UI components
│   │   ├── pipes/            # Custom pipes
│   │   └── index.ts          # Barrel exports
│   ├── features/             # Feature modules
│   │   ├── setup/            # Setup wizard feature
│   │   ├── dashboard/        # Dashboard feature
│   │   └── analyzer/         # Library analysis feature (future)
│   ├── models/               # TypeScript interfaces and types
│   ├── app.component.*       # Root application component
│   ├── app.config.ts         # Application configuration
│   └── app.routes.ts         # Application routing
├── styles.scss               # Global styles
├── theme.scss                # Material Design theme
└── index.html                # Application entry point
```

## Architectural Patterns

### 1. Standalone Components
All components use Angular 17's standalone architecture:
- No NgModules needed
- Direct imports in component decorators
- Tree-shakable and more maintainable

### 2. Feature-Based Organization
The application is organized by features rather than technical layers:
- Each feature has its own directory
- Components, services, and models are co-located
- Promotes high cohesion and loose coupling

### 3. Service-Oriented Architecture
- **Core Services**: Handle business logic and API communication
- **Feature Services**: Handle feature-specific state and operations
- **Shared Services**: Provide common functionality across features

### 4. Reactive Programming
- RxJS for asynchronous operations
- Observable streams for data flow
- Async pipe for template subscriptions

## Core Services

### ConfigService
Manages application configuration and service connections.

**Responsibilities:**
- Load and save application configuration
- Test service connections
- Manage configuration state

**Key Methods:**
- `loadConfigStatus()`: Get current configuration status
- `updateConfig(config)`: Update application configuration
- `testConnections()`: Test all configured service connections

### LibraryService
Handles Plex library data and statistics.

**Responsibilities:**
- Fetch library information
- Retrieve library statistics
- Manage library data caching

**Key Methods:**
- `getLibraries()`: Get all Plex libraries
- `getGlobalStats()`: Get aggregated statistics
- `refreshAllStats()`: Refresh cached statistics

## Shared Components

### LoadingComponent
Reusable loading spinner with customizable properties.

**Features:**
- Configurable size and message
- Optional centering
- Smooth animations
- Consistent styling

**Usage:**
```html
<app-loading 
  message="Loading data..."
  [size]="50"
  [centered]="true">
</app-loading>
```

### BytesPipe
Formats byte values into human-readable sizes.

**Features:**
- Automatic unit selection (B, KB, MB, GB, TB)
- Configurable precision
- Handle null/undefined values

**Usage:**
```html
{{ fileSize | bytes:2 }}
```

## Features

### Setup Wizard
Multi-step configuration wizard for initial application setup.

**Components:**
- `SetupWizardComponent`: Main wizard container
- Material Stepper for step navigation
- Reactive forms for data collection

**Features:**
- Plex server configuration (required)
- Optional service integration (Tautulli, Radarr, Sonarr)
- Connection testing
- Configuration validation

### Dashboard
Main application dashboard showing library overview and statistics.

**Components:**
- `DashboardComponent`: Main dashboard container
- Library cards with statistics
- Global statistics overview
- Storage breakdown visualization

**Features:**
- Real-time data loading
- Refresh functionality
- Responsive design
- Empty state handling

## Styling and Theming

### Material Design Theme
The application uses a custom Material Design theme with:
- **Primary Color**: Blue (#1976d2)
- **Accent Color**: Orange (#ff9800)
- **Typography**: Roboto font family
- **Custom CSS variables**: For consistent theming

### Responsive Design
- Mobile-first approach
- Breakpoint-based responsive utilities
- Grid layouts that adapt to screen size
- Touch-friendly interface elements

### Style Architecture
- **Global Styles**: Base styles and utilities in `styles.scss`
- **Theme Configuration**: Material theme in `theme.scss`
- **Component Styles**: Scoped SCSS files per component
- **Utility Classes**: Common spacing, typography, and layout classes

## Performance Considerations

### Lazy Loading
- Feature modules are loaded on-demand
- Reduces initial bundle size
- Improves first-page load time

### OnPush Change Detection
- Strategic use of OnPush strategy
- Reduces unnecessary change detection cycles
- Improves rendering performance

### Shared Components
- Reusable components reduce code duplication
- Consistent UI patterns
- Easier maintenance and updates

## Development Patterns

### Component Design
1. **Single Responsibility**: Each component has one clear purpose
2. **Input/Output Pattern**: Clear component APIs with @Input and @Output
3. **Smart/Dumb Components**: Container components handle logic, presentation components handle display
4. **Lifecycle Management**: Proper cleanup of subscriptions and resources

### Error Handling
- Global error handling service
- User-friendly error messages
- Graceful degradation for optional features
- Loading and error states in components

### Code Quality
- TypeScript strict mode enabled
- ESLint for code quality
- Consistent naming conventions
- Documentation for complex logic

## Testing Strategy

### Unit Tests
- Jest for fast unit testing
- Component testing with Angular Testing Library
- Service testing with mocked dependencies
- Pipe testing for pure functions

### Integration Tests
- Feature-level integration tests
- API integration testing
- End-to-end user workflows

## Future Enhancements

### Phase 4: Analysis Features
- Library size analysis components
- Quality analysis visualization
- Content analysis dashboard

### Phase 5: Advanced Features
- Export functionality
- Settings management
- User preferences

### Performance Optimizations
- Virtual scrolling for large lists
- Image lazy loading
- Progressive Web App features
- Service Worker caching

## Deployment

### Build Process
- Production build with optimization
- Tree shaking for smaller bundles
- Asset optimization and compression
- Source map generation for debugging

### Environment Configuration
- Environment-specific configuration files
- Runtime configuration loading
- Feature flags for development

## Contributing Guidelines

### Code Style
- Follow Angular style guide
- Use TypeScript interfaces for type safety
- Implement proper error handling
- Write meaningful commit messages

### Component Development
1. Create component with Angular CLI
2. Implement component logic
3. Add proper TypeScript types
4. Style with SCSS
5. Write unit tests
6. Update documentation

This architecture provides a solid foundation for the Plex Analyzer frontend while maintaining flexibility for future enhancements.