import { ConnectionManager } from './connectionManager';
import { SelectionManager } from './selectionManager';
import { ConnectionUpdater } from './connectionUpdater';
import { CONNECTION_PREFIX } from '../utils/constants';

export class PluginInitializer {
  private connectionManager = new ConnectionManager();
  private selectionManager = new SelectionManager();
  private connectionUpdater = new ConnectionUpdater();

  async initialize(autoUpdateEnabled: boolean): Promise<void> {
    try {
      await figma.loadAllPagesAsync();

      figma.on('documentchange', async (event) => {
        let shouldCheckConnections = false;

        for (const change of event.documentChanges) {
          if (change.type === 'PROPERTY_CHANGE') {
            const node = change.node;
            
            if (node.type === 'FRAME' && 'name' in node && 'parent' in node) {
              const frameNode = node as FrameNode;

              if (frameNode.name === 'Connection Label') {
                continue;
              }

              let parent = frameNode.parent;
              while (parent) {
                if (parent.type === 'GROUP' && parent.name.startsWith(CONNECTION_PREFIX)) {
                  break;
                }
                parent = parent.parent;
              }
              if (parent) {
                continue;
              }

              const hasPositionChange = change.properties.some(prop =>
                prop === 'x' || prop === 'y' || prop === 'width' || prop === 'height'
              );
              
              if (hasPositionChange) {
                shouldCheckConnections = true;
                break;
              }
            }
          }
        }

        if (shouldCheckConnections) {
          setTimeout(() => this.connectionUpdater.checkAndUpdateConnections(autoUpdateEnabled), 100);
        }
      });

      figma.on('selectionchange', () => this.selectionManager.checkSelection());

      this.connectionManager.migrateOldConnections();
      this.selectionManager.checkSelection();
      this.connectionManager.trackConnections();

    } catch (error) {
      console.error('Failed to initialize plugin:', error);
      // Fallback initialization
      this.connectionManager.migrateOldConnections();
      figma.on('selectionchange', () => this.selectionManager.checkSelection());
      this.selectionManager.checkSelection();
      this.connectionManager.trackConnections();
    }
  }
}
