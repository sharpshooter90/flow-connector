# Flow Connector - Figma Plugin

A Figma plugin that creates configurable connection arrows between frames. Perfect for creating flowcharts, user journey maps, and process diagrams.

## Features

- **Smart Connection Detection**: Automatically connects frames at the optimal edge points
- **Comprehensive Styling Options**: 
  - 6 predefined stroke colors
  - 4 stroke width options (1-4px)
  - 3 stroke styles (solid, dashed, dotted)
  - 3 sloppiness levels for hand-drawn effects
  - 3 arrow types (straight, curved, elbow)
  - 3 arrowhead options (none, end, both)
  - Opacity control (0-100%)
- **Connection Labels**: Add optional text labels positioned at connection midpoint
- **Auto-Creation**: Instant connection creation when selecting 2 frames with Shift+Click
- **Auto-Update**: Connections automatically reposition when connected frames are moved or resized
- **Live Editing**: Select any existing connection to edit its properties in real-time
- **Persistent Configuration**: Connection settings are stored and can be modified later
- **Intelligent Positioning**: Automatically calculates optimal connection points based on frame positions

## How to Use

### Creating New Connections
1. **Select Frames**: Use Shift+Click to select exactly 2 frames you want to connect
2. **Configure Connection**: 
   - Choose stroke color from 6 predefined colors
   - Select stroke width (1-4px)
   - Pick stroke style (solid, dashed, dotted)
   - Adjust sloppiness for hand-drawn effect
   - Choose arrow type (straight, curved, elbow)
   - Set arrowheads (none, end, both)
   - Control opacity (0-100%)
   - Add optional label text
3. **Auto-Create**: With "Auto-create on selection" enabled (default), connections are created instantly
4. **Manual Create**: Disable auto-create to use the "Create Connection" button manually
5. **Auto-Update**: Enable "Auto-update when frames move" to automatically reposition connections when frames change

### Updating Existing Connections
1. **Select Connection**: Click on any existing flow connection in your canvas
2. **Edit Mode**: The plugin automatically switches to edit mode, showing current settings
3. **Live Updates**: Any changes to configuration instantly update the selected connection
4. **Visual Feedback**: Orange status bar indicates you're editing an existing connection

### Automatic Connection Updates
1. **Enable Auto-Update**: Check "Auto-update when frames move" (enabled by default)
2. **Move Frames**: Drag or resize any connected frames in your canvas
3. **Instant Updates**: Connections automatically reposition to maintain optimal connection points
4. **Smart Tracking**: Plugin tracks all connections and updates them as needed

## Installation

1. Clone this repository
2. Run `npm install` to install dependencies
3. Run `npm run build` to compile TypeScript
4. In Figma: `Plugins` → `Development` → `Import plugin from manifest...`
5. Select the `manifest.json` file from this repo

## Development

- `npm run build` - Compile TypeScript to JavaScript
- `npm run watch` - Watch for changes and auto-compile
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues automatically

## Technical Details

### Connection Intelligence
The plugin intelligently determines connection points by:
- Calculating frame centers and relative positions
- Choosing horizontal vs vertical connections based on distance
- Connecting at the nearest edge points for clean, professional-looking arrows

### Connection Structure
Each connection is a grouped element containing:
- Main connection line (with configurable path type)
- Arrow heads (start and/or end, based on configuration)
- Optional text label (positioned at connection midpoint)
- Stored metadata for future editing

### Persistent Configuration
- Connection settings are stored as plugin data within each connection group
- Selecting a connection automatically loads its configuration into the UI
- Real-time updates allow immediate visual feedback when editing
- Metadata includes original frame references for proper reconnection

### Automatic Updates
- Plugin tracks all connections on the current page for automatic updates
- Listens for document changes to detect when frames are moved or resized
- Debounced updates prevent excessive recalculations during rapid changes
- Maintains connection styling and configuration during automatic updates
- Smart detection only updates connections when frame positions actually change

### Path Generation
- **Straight**: Direct line between connection points
- **Curved**: Smooth bezier curve with intelligent control points
- **Elbow**: Right-angle connection with intermediate waypoint
- **Sloppiness**: Adds controlled randomness for hand-drawn appearance

## Requirements

- Figma Desktop App or Browser
- Node.js and npm for development

## License

MIT License - feel free to use and modify for your projects!