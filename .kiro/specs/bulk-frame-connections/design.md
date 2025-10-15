# Design Document

## Overview

The bulk frame connections feature extends the existing Flow Connector plugin to support multi-frame selection and bulk operations. This design builds upon the current architecture while adding new selection management, bulk operation capabilities, and enhanced UI states.

The feature introduces a new selection paradigm where users can select multiple frames without modifier keys, see bulk action states in the header, create connections between all selected frames simultaneously, and edit properties of multiple connections at once.

## Architecture

### Core Components

The bulk functionality integrates with existing services and adds new capabilities:

1. **Enhanced Selection Manager** - Extends current `SelectionManager` to handle multi-frame selection
2. **Bulk Operations Service** - New service for coordinating bulk connection creation and updates
3. **Bulk UI State Management** - Enhanced `AppState` and UI components for bulk operations
4. **Connection Batch Processor** - Handles efficient creation and updating of multiple connections

### Integration Points

- **Existing ConnectionCreator** - Reused for individual connection creation within bulk operations
- **Existing ConnectionManager** - Enhanced to handle bulk metadata operations
- **Existing UI Components** - Extended to show bulk states and controls
- **Figma Plugin API** - Leveraged for efficient batch operations

## Components and Interfaces

### Enhanced Types

```typescript
// Extended AppState for bulk operations
interface BulkAppState extends AppState {
  selectedFrames: Array<{ id: string; name: string }>;
  isBulkMode: boolean;
  bulkSelectedConnections: string[];
  bulkOperationInProgress: boolean;
}

// Bulk operation configuration
interface BulkOperationConfig {
  connectionConfig: ConnectionConfig;
  selectedFrameIds: string[];
  operationType: 'create' | 'update';
  targetConnectionIds?: string[];
}

// Bulk operation result
interface BulkOperationResult {
  successful: number;
  failed: number;
  errors: Array<{ frameIds?: string[]; connectionId?: string; error: string }>;
  createdConnections?: string[];
  updatedConnections?: string[];
}
```

### Enhanced Selection Manager

```typescript
class EnhancedSelectionManager extends SelectionManager {
  private selectedFrameIds: Set<string> = new Set();
  
  // Multi-frame selection without modifiers
  handleFrameSelection(frameId: string, isMultiSelect: boolean): void
  
  // Get all connections associated with selected frames
  getConnectionsForSelectedFrames(): GroupNode[]
  
  // Check if frames can be bulk connected
  validateBulkConnection(frameIds: string[]): ValidationResult
}
```

### Bulk Operations Service

```typescript
class BulkOperationsService {
  private connectionCreator: ConnectionCreator;
  private connectionManager: ConnectionManager;
  private frameOrderAnalyzer: FrameOrderAnalyzer;
  
  // Create connections between all selected frames
  async createBulkConnections(config: BulkOperationConfig): Promise<BulkOperationResult>
  
  // Update properties of multiple connections
  async updateBulkConnections(config: BulkOperationConfig): Promise<BulkOperationResult>
  
  // Generate connection pairs from selected frames with ordering
  private generateConnectionPairs(frameIds: string[]): Array<[string, string]>
  
  // Batch process connections with progress tracking
  private processBatch<T>(items: T[], processor: (item: T) => Promise<void>): Promise<BulkOperationResult>
}

### Frame Order Analyzer

```typescript
class FrameOrderAnalyzer {
  // Analyze frame layout and determine connection order
  analyzeFrameLayout(frames: FrameNode[]): FrameLayoutAnalysis
  
  // Detect if frames are in a recognizable pattern
  detectLayoutPattern(frames: FrameNode[]): LayoutPattern
  
  // Sort frames based on detected pattern
  sortFramesByPattern(frames: FrameNode[], pattern: LayoutPattern): FrameNode[]
  
  // Check if frames are scattered (no clear pattern)
  isScatteredLayout(frames: FrameNode[]): boolean
}

interface FrameLayoutAnalysis {
  pattern: LayoutPattern;
  isOrdered: boolean;
  sortedFrames: FrameNode[];
  confidence: number; // 0-1 confidence in the detected pattern
  suggestions: string[]; // User-facing suggestions for better ordering
}

interface LayoutPattern {
  type: 'horizontal' | 'vertical' | 'grid' | 'scattered' | 'circular';
  direction?: 'left-to-right' | 'right-to-left' | 'top-to-bottom' | 'bottom-to-top';
  gridDimensions?: { rows: number; cols: number };
}
```
```

### Enhanced UI Components

#### Bulk Header Component
- Shows selected frame count and layout analysis
- Displays bulk action buttons with ordering options
- Provides connection creation controls with pattern selection
- Shows operation progress and layout warnings
- Offers frame reordering suggestions for scattered layouts

#### Bulk Properties Panel
- Mixed state indicators for properties
- Bulk editing controls
- Apply to all functionality
- Individual connection override options

## Frame Ordering and Layout Detection

### Layout Pattern Detection Algorithm

The system analyzes selected frames to determine their spatial arrangement and suggests appropriate connection strategies:

1. **Horizontal Layout Detection**
   - Sort frames by X coordinate (left to right)
   - Check if Y coordinates are roughly aligned (within tolerance)
   - Confidence based on alignment consistency

2. **Vertical Layout Detection**
   - Sort frames by Y coordinate (top to bottom)
   - Check if X coordinates are roughly aligned (within tolerance)
   - Confidence based on alignment consistency

3. **Grid Layout Detection**
   - Analyze both X and Y coordinate patterns
   - Detect regular spacing and alignment
   - Determine grid dimensions and reading order

4. **Scattered Layout Detection**
   - No clear horizontal, vertical, or grid pattern
   - High variance in both X and Y coordinates
   - Low confidence in any ordering pattern

### User Feedback for Layout Issues

When frames are detected as scattered or have low confidence ordering:

- **Warning Message**: "Selected frames appear scattered. Connection order may not be predictable."
- **Suggestions**: 
  - "Arrange frames in a line (horizontal/vertical) for sequential connections"
  - "Select a center frame for hub-and-spoke connections"
  - "Use custom connection mode to manually specify pairs"
- **Alternative Strategies**: Offer hub-and-spoke or full-mesh connection options

### Connection Strategy Options

1. **Sequential (Default for ordered layouts)**
   - Connect frames in detected order: A→B→C→D
   - Best for linear workflows

2. **Hub-and-Spoke (Recommended for scattered layouts)**
   - User selects or system suggests center frame
   - All other frames connect to/from center: A→Center, B→Center, C→Center

3. **Full-Mesh (Advanced option)**
   - Every frame connects to every other frame
   - Warning about connection density

4. **Custom Pairs**
   - User manually specifies which frames to connect
   - Fallback for complex layouts

## Data Models

### Bulk Selection State

```typescript
interface BulkSelectionState {
  selectedFrames: Map<string, FrameNode>;
  associatedConnections: Map<string, GroupNode[]>;
  bulkEditableProperties: Set<keyof ConnectionConfig>;
  mixedPropertyStates: Map<keyof ConnectionConfig, boolean>;
  frameLayout: FrameLayoutAnalysis;
  connectionStrategy: ConnectionStrategy;
}

interface ConnectionStrategy {
  type: 'sequential' | 'hub-and-spoke' | 'full-mesh' | 'custom';
  centerFrameId?: string; // for hub-and-spoke
  customPairs?: Array<[string, string]>; // for custom strategy
}
```

### Connection Relationship Mapping

```typescript
interface ConnectionRelationships {
  frameToConnections: Map<string, string[]>;
  connectionToFrames: Map<string, [string, string]>;
  bulkEditableConnections: Set<string>;
}
```

## Error Handling

### Bulk Operation Error Management

1. **Partial Success Handling**
   - Continue processing remaining items when individual operations fail
   - Collect and report all errors with context
   - Provide retry mechanisms for failed operations

2. **Validation Errors**
   - Pre-validate all operations before execution
   - Check frame existence and accessibility
   - Validate connection configuration compatibility

3. **Resource Constraints**
   - Implement batch size limits to prevent performance issues
   - Add progress indicators for long-running operations
   - Provide cancellation mechanisms

### Error Recovery Strategies

```typescript
interface ErrorRecoveryStrategy {
  retryFailedOperations(failures: BulkOperationError[]): Promise<BulkOperationResult>;
  rollbackPartialChanges(operationId: string): Promise<void>;
  reportErrorsToUser(errors: BulkOperationError[]): void;
}
```

## Testing Strategy

### Unit Testing Focus Areas

1. **Selection Logic Testing**
   - Multi-frame selection without modifiers
   - Selection state management
   - Frame validation and filtering

2. **Bulk Operations Testing**
   - Connection creation with various frame combinations
   - Property updates across multiple connections
   - Error handling and partial failures

3. **UI State Management Testing**
   - Bulk mode transitions
   - Mixed property state calculations
   - Progress indication accuracy

### Integration Testing Scenarios

1. **End-to-End Bulk Workflows**
   - Select multiple frames → Create bulk connections → Edit properties
   - Mixed selection scenarios (frames + existing connections)
   - Large-scale operations (10+ frames)

2. **Error Scenario Testing**
   - Network interruptions during bulk operations
   - Invalid frame selections
   - Conflicting property updates

### Performance Testing

1. **Scalability Testing**
   - Bulk operations with 20+ frames
   - Memory usage during large operations
   - UI responsiveness during processing

2. **Figma API Efficiency**
   - Batch API call optimization
   - Plugin data storage efficiency
   - Selection change performance

## Implementation Phases

### Phase 1: Enhanced Selection Management
- Extend SelectionManager for multi-frame selection
- Update UI to show bulk selection states
- Implement frame selection without modifiers

### Phase 2: Frame Layout Analysis
- Implement FrameOrderAnalyzer service
- Add layout pattern detection algorithms
- Create user feedback for scattered layouts

### Phase 3: Bulk Connection Creation
- Implement BulkOperationsService with ordering support
- Add multiple connection strategies (sequential, hub-and-spoke, full-mesh)
- Update header with bulk action controls and layout warnings

### Phase 4: Bulk Property Editing
- Extend PropertiesPanel for bulk editing
- Implement mixed state indicators
- Add bulk property update functionality

### Phase 5: Error Handling and Polish
- Implement comprehensive error handling
- Add progress indicators and cancellation
- Performance optimization and testing
- Layout suggestion improvements