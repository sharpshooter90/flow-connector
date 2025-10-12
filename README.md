# Flow Connector - Figma Plugin

A Figma plugin that creates configurable connection arrows between frames. Perfect for creating flowcharts, user journey maps, and process diagrams.

## Features

- **Smart Connection Detection**: Automatically connects frames at the optimal edge points
- **Configurable Styling**: 
  - Custom arrow colors
  - Adjustable line width (1-8px)
  - Multiple arrow styles (simple, filled, outline)
- **Connection Labels**: Add optional text labels in the middle of connections
- **Real-time Selection**: Live feedback showing selected frames
- **Intelligent Positioning**: Automatically calculates the best connection points based on frame positions

## How to Use

1. **Select Frames**: Use Shift+Click to select exactly 2 frames you want to connect
2. **Configure Connection**: 
   - Choose arrow color using the color picker
   - Adjust line width with the slider
   - Select arrow style from dropdown
   - Add an optional label text
3. **Create Connection**: Click "Create Connection" to generate the arrow
4. **Result**: A grouped connection with line, arrow head, and optional label

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

The plugin intelligently determines connection points by:
- Calculating frame centers and relative positions
- Choosing horizontal vs vertical connections based on distance
- Connecting at the nearest edge points for clean, professional-looking arrows

Connection elements are grouped together for easy manipulation and include:
- Main connection line
- Arrow head (with configurable style)
- Optional text label (positioned at connection midpoint)

## Requirements

- Figma Desktop App or Browser
- Node.js and npm for development

## License

MIT License - feel free to use and modify for your projects!