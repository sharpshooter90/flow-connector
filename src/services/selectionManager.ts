import { ConnectionManager } from './connectionManager';

export class SelectionManager {
  private connectionManager = new ConnectionManager();

  checkSelection() {
    const selection = figma.currentPage.selection;
    const frames = selection.filter(node => node.type === 'FRAME') as FrameNode[];
    const connections = selection.filter(node => this.connectionManager.isFlowConnection(node)) as GroupNode[];

    // Check if a single connection is selected
    if (connections.length === 1 && selection.length === 1) {
      const connection = connections[0];
      const metadata = this.connectionManager.getConnectionMetadata(connection);

      if (metadata) {
        figma.ui.postMessage({
          type: 'connection-selected',
          config: metadata.config,
          connectionId: connection.id,
          connectionName: connection.name
        });
        return;
      }
    }

    figma.ui.postMessage({
      type: 'selection-changed',
      frameCount: frames.length,
      frames: frames.map(frame => ({ id: frame.id, name: frame.name })),
      connectionCount: connections.length
    });

    return { frames, connections };
  }
}