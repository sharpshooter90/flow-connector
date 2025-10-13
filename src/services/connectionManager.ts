import { ConnectionMetadata } from '../types/plugin';
import { CONNECTION_PREFIX, LEGACY_CONNECTION_PREFIX, PLUGIN_DATA_KEY } from '../utils/constants';

export class ConnectionManager {
  private static trackedConnections = new Map<string, ConnectionMetadata>();

  isFlowConnection(node: SceneNode): boolean {
    return node.type === 'GROUP' && node.name.startsWith(CONNECTION_PREFIX);
  }

  getConnectionMetadata(group: GroupNode): ConnectionMetadata | null {
    try {
      const metadataString = group.getPluginData(PLUGIN_DATA_KEY);
      if (metadataString) {
        return JSON.parse(metadataString) as ConnectionMetadata;
      }
    } catch (error) {
      console.error('Failed to parse connection metadata:', error);
    }
    return null;
  }

  setConnectionMetadata(group: GroupNode, metadata: ConnectionMetadata) {
    group.setPluginData(PLUGIN_DATA_KEY, JSON.stringify(metadata));
  }

  findAllConnections(): GroupNode[] {
    const connections: GroupNode[] = [];

    const traverse = (node: SceneNode) => {
      if (this.isFlowConnection(node)) {
        connections.push(node as GroupNode);
      }

      if ('children' in node) {
        for (const child of node.children) {
          traverse(child);
        }
      }
    };

    for (const child of figma.currentPage.children) {
      traverse(child);
    }

    return connections;
  }

  trackConnections() {
    const connections = this.findAllConnections();
    ConnectionManager.trackedConnections.clear();

    for (const connection of connections) {
      const metadata = this.getConnectionMetadata(connection);
      if (metadata) {
        ConnectionManager.trackedConnections.set(connection.id, metadata);
      }
    }
  }

  getTrackedConnections() {
    return ConnectionManager.trackedConnections;
  }

  addTrackedConnection(connectionId: string, metadata: ConnectionMetadata) {
    ConnectionManager.trackedConnections.set(connectionId, metadata);
  }

  removeTrackedConnection(connectionId: string) {
    ConnectionManager.trackedConnections.delete(connectionId);
  }

  migrateOldConnections() {
    const allGroups = figma.currentPage.findAll(node =>
      node.type === 'GROUP' && 
      node.name.startsWith(LEGACY_CONNECTION_PREFIX) && 
      !node.name.startsWith(CONNECTION_PREFIX)
    ) as GroupNode[];

    for (const group of allGroups) {
      const oldName = group.name;
      group.name = oldName.replace(LEGACY_CONNECTION_PREFIX, CONNECTION_PREFIX);
      console.log(`Migrated connection: ${oldName} → ${group.name}`);
    }

    if (allGroups.length > 0) {
      console.log(`Migrated ${allGroups.length} connections to new naming convention`);
    }
  }
}
