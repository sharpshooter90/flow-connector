# Flow Connector Plugin - Modular Structure

The `code.ts` file has been successfully modularized into focused, single-responsibility modules. Here's the new structure:

## 📁 Project Structure

```
src/
├── types/
│   └── plugin.ts              # Type definitions and interfaces
├── utils/
│   ├── constants.ts           # Configuration constants and defaults
│   └── helpers.ts             # Utility functions (hexToRgb, viewport management)
└── services/
    ├── connectionManager.ts   # Connection metadata and tracking
    ├── pathCalculator.ts      # Connection point and routing calculations
    ├── pathRenderer.ts        # SVG path generation and styling
    ├── arrowRenderer.ts       # Arrow head creation
    ├── labelRenderer.ts       # Label positioning and creation
    ├── connectionCreator.ts   # Main connection creation orchestrator
    ├── connectionUpdater.ts   # Connection updates and auto-updates
    ├── selectionManager.ts    # Selection handling and UI communication
    ├── storageManager.ts      # Configuration persistence
    └── pluginInitializer.ts   # Plugin initialization and event setup
```

## 🎯 Module Responsibilities

### **Types & Configuration**
- **`plugin.ts`**: All TypeScript interfaces and type definitions
- **`constants.ts`**: Default configuration, plugin constants, and keys

### **Utilities**
- **`helpers.ts`**: Pure utility functions for color conversion, geometry, and viewport management

### **Core Services**

#### **Connection Management**
- **`connectionManager.ts`**: Handles connection metadata, tracking, and migration
- **`connectionCreator.ts`**: Orchestrates the creation of new connections
- **`connectionUpdater.ts`**: Manages connection updates and auto-update logic

#### **Rendering Services**
- **`pathCalculator.ts`**: Calculates connection points, routing, and avoidance paths
- **`pathRenderer.ts`**: Generates SVG paths with curves, elbows, and styling
- **`arrowRenderer.ts`**: Creates arrow heads with proper angles and styling
- **`labelRenderer.ts`**: Positions and creates connection labels

#### **System Services**
- **`selectionManager.ts`**: Handles Figma selection changes and UI communication
- **`storageManager.ts`**: Manages configuration persistence to Figma's client storage
- **`pluginInitializer.ts`**: Sets up event listeners and initializes the plugin

## 🔄 Main Plugin File (`code.ts`)

The main file is now clean and focused on:
- **Service orchestration**: Instantiating and coordinating services
- **Message handling**: Processing UI messages through clean handlers
- **Plugin lifecycle**: Initialization and error handling
- **State management**: Managing plugin-level state (auto-create, auto-update)

## ✅ Benefits of This Structure

1. **Single Responsibility**: Each module has one clear purpose
2. **Testability**: Services can be unit tested independently
3. **Maintainability**: Changes are isolated to specific modules
4. **Reusability**: Services can be reused across different contexts
5. **Type Safety**: Strong typing throughout with centralized type definitions
6. **Separation of Concerns**: UI logic, business logic, and data persistence are separated

## 🚀 Usage

The modular structure maintains the same external API while providing much better internal organization. All existing functionality is preserved, but now it's:
- Easier to debug specific features
- Simpler to add new functionality
- More maintainable for future development
- Better organized for team collaboration

Each service is self-contained with clear dependencies, making the codebase much more professional and scalable.